-- Inspections. An admin schedules a kennel visit (day, time, inspector) for a store applying to go live; the
-- store's owner and the inspector are told. The inspector works through a sheet: a checklist (each check
-- passed or failed, with a note), every listed dog seen with its protection level confirmed, photos (private,
-- staff only) and a summary, saved as they go. Recording the result:
--   passed → the store is verified; its public inspection record names the date, the inspector and the checks
--            passed; each dog seen gets "Inspected <month>" on its K9 file and its confirmed level.
--   failed → the store goes back to its owner as a draft, with the summary as the reason.
-- Admins see every inspection; inspectors see the ones assigned to them. Everything is in the audit log.

create type public.inspection_status as enum ('scheduled', 'passed', 'failed', 'cancelled');

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  inspector_id uuid references auth.users (id) on delete set null,
  scheduled_for timestamptz not null,
  status public.inspection_status not null default 'scheduled',
  note text not null default '' check (length(note) <= 500),
  checklist jsonb not null default '[]',   -- [{ key, label, ok: true | false | null, note }]
  dogs jsonb not null default '[]',        -- [{ id, file_no, name, listed_level, seen, confirmed_level, note }]
  photos text[] not null default '{}' check (cardinality(photos) <= 30),
  summary text not null default '' check (length(summary) <= 2000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index inspections_store_idx on public.inspections (store_id, scheduled_for desc);
create index inspections_inspector_idx on public.inspections (inspector_id, scheduled_for);

-- ── Staff may now write Dogeash's protected parts (from inside these functions) ──
-- A store's inspection record: admins and inspectors (inspectors can't edit stores directly; this is for the
-- function that records a passed inspection)
create or replace function public.protect_store_details()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  owned text[] := array['inspection', 'reviewSamples', 'dogsPlaced', 'replies'];
  k text;
begin
  if auth.uid() is null or public.is_staff('{admin,inspector}') then return new; end if;
  new.details := coalesce(new.details, '{}'::jsonb) - owned;
  if tg_op = 'UPDATE' then
    foreach k in array owned loop
      if old.details ? k then new.details := jsonb_set(new.details, array[k], old.details -> k); end if;
    end loop;
  end if;
  return new;
end;
$$;

-- A dog's "inspected" line: the same
create or replace function public.prepare_dog()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.file_no is null then
    new.file_no := 'KD-' || extract(year from now())::int || '-' || lpad(nextval('public.dog_file_seq')::text, 3, '0');
  end if;
  if auth.uid() is null or public.is_staff('{admin,inspector}') then return new; end if;

  if tg_op = 'INSERT' then
    new.file := coalesce(new.file, '{}'::jsonb) - 'inspected';
  else
    new.file := case
      when old.file ? 'inspected' then coalesce(new.file, '{}'::jsonb) || jsonb_build_object('inspected', old.file -> 'inspected')
      else coalesce(new.file, '{}'::jsonb) - 'inspected'
    end;
  end if;
  return new;
end;
$$;

-- ── Helpers ─────────────────────────────────────────────────────────────────
-- May the signed-in staff member work on this inspection? Admins: any. Inspectors: their own.
create function public.can_work_inspection(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_staff('{admin}') or (
    public.is_staff('{inspector}') and exists (select 1 from public.inspections i where i.id = target and i.inspector_id = auth.uid())
  )
$$;

-- Staff, for choosing an inspector
create function public.admin_staff()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return (select coalesce(jsonb_agg(x order by x.role desc, x.name), '[]') from (
    select s.user_id as id, s.role, coalesce(nullif(p.full_name, ''), u.email) as name
    from public.staff s join auth.users u on u.id = s.user_id left join public.profiles p on p.id = s.user_id
  ) x);
end;
$$;

-- ── Scheduling ──────────────────────────────────────────────────────────────
create function public.admin_schedule_inspection(target text, at timestamptz, inspector uuid, note text default '')
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  st record;
  new_id uuid;
  who text;
  dog_list jsonb;
  when_text text := to_char(at at time zone 'Africa/Lagos', 'Dy FMDD Mon "at" HH24:MI');
begin
  perform public.require_staff('{admin}');
  select id, name, status into st from public.stores where public_id = target;
  if st is null then raise exception 'No store %', target; end if;
  if not exists (select 1 from public.staff where user_id = inspector) then raise exception 'The inspector must be staff'; end if;
  if at < now() then raise exception 'Choose a time from now on'; end if;
  if exists (select 1 from public.inspections where store_id = st.id and status = 'scheduled') then
    raise exception 'This store already has an inspection booked';
  end if;
  select coalesce(nullif(p.full_name, ''), u.email) into who from auth.users u left join public.profiles p on p.id = u.id where u.id = inspector;
  -- Every dog the store lists, to be seen on the day
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'file_no', d.file_no, 'name', d.name, 'breed', d.breed,
      'listed_level', d.level, 'seen', false, 'confirmed_level', d.level, 'note', '') order by d.name), '[]')
    into dog_list from public.dogs d where d.store_id = st.id and d.status not in ('sold', 'withdrawn');

  insert into public.inspections (store_id, inspector_id, scheduled_for, note, dogs, created_by)
  values (st.id, inspector, at, left(trim(coalesce(note, '')), 500), dog_list, auth.uid())
  returning id into new_id;

  perform public.admin_log('inspection.schedule', 'store', target, jsonb_build_object('at', at, 'inspector', who, 'note', note));
  perform public.notify(m.user_id, 'store', 'Inspection booked: ' || when_text,
    who || ' from Dogeash will visit ' || st.name || '. Have your dogs'' vet records and microchip numbers ready.',
    '/dashboard/application', 'inspection:' || new_id)
  from public.store_members m where m.store_id = st.id and m.role in ('owner', 'manager');
  if inspector <> auth.uid() then
    perform public.notify(inspector, 'store', 'You''re inspecting ' || st.name, when_text || '. The sheet is in Inspections.', '/admin/inspections/' || new_id, 'inspection-assigned:' || new_id);
  end if;
  return new_id;
end;
$$;

create function public.admin_cancel_inspection(target uuid, note text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  ins record;
  why text := trim(coalesce(note, ''));
begin
  perform public.require_staff('{admin}');
  if why = '' then raise exception 'Give a reason'; end if;
  select i.id, i.status, s.id as store_id, s.public_id, s.name into ins from public.inspections i join public.stores s on s.id = i.store_id where i.id = target;
  if ins is null or ins.status <> 'scheduled' then raise exception 'Only a booked inspection can be cancelled'; end if;
  update public.inspections set status = 'cancelled', summary = why, completed_at = now() where id = target;
  perform public.admin_log('inspection.cancel', 'store', ins.public_id, jsonb_build_object('note', why));
  perform public.notify(m.user_id, 'store', 'Inspection cancelled', why, '/dashboard/application', 'inspection:' || target)
  from public.store_members m where m.store_id = ins.store_id and m.role in ('owner', 'manager');
end;
$$;

-- ── Reading ─────────────────────────────────────────────────────────────────
-- Inspections, newest first: all for admins, their own for inspectors
create function public.admin_inspections()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin,inspector}');
  return (select coalesce(jsonb_agg(x order by x.scheduled_for desc), '[]') from (
    select i.id, i.status, i.scheduled_for, i.completed_at, i.note, i.summary,
      s.public_id as store_id, s.name as store_name, s.city as store_city, s.status as store_status,
      coalesce(nullif(p.full_name, ''), u.email) as inspector,
      jsonb_array_length(i.dogs) as dogs,
      (select count(*) from jsonb_array_elements(i.checklist) c where c ->> 'ok' is not null) as checked
    from public.inspections i join public.stores s on s.id = i.store_id
    left join auth.users u on u.id = i.inspector_id left join public.profiles p on p.id = i.inspector_id
    where public.is_staff('{admin}') or i.inspector_id = auth.uid()
  ) x);
end;
$$;

-- One inspection with everything the sheet needs: the store, its application (address, phone), the dogs with photos
create function public.admin_inspection(target uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.can_work_inspection(target) then raise exception 'Staff only' using errcode = '42501'; end if;
  return (select to_jsonb(x) from (
    select i.*, s.public_id as store_public_id, s.name as store_name, s.city as store_city, s.status as store_status,
      a.address, a.directions, a.contact_phone,
      coalesce(nullif(p.full_name, ''), u.email) as inspector,
      (select coalesce(jsonb_object_agg(d.id, d.photo_path), '{}') from public.dogs d where d.store_id = s.id) as dog_photos
    from public.inspections i join public.stores s on s.id = i.store_id
    left join public.store_applications a on a.store_id = s.id
    left join auth.users u on u.id = i.inspector_id left join public.profiles p on p.id = i.inspector_id
    where i.id = target
  ) x);
end;
$$;

-- The store's own view: its latest inspection (when, who, how it went), for its owner
create function public.my_store_inspection(target uuid)
returns jsonb language sql stable security definer set search_path = ''
as $$
  select case when public.has_store_role(target, '{owner,manager}') then (
    select to_jsonb(x) from (
      select i.status, i.scheduled_for, i.completed_at, coalesce(nullif(p.full_name, ''), 'Dogeash') as inspector
      from public.inspections i left join public.profiles p on p.id = i.inspector_id
      where i.store_id = target order by i.created_at desc limit 1
    ) x) end
$$;

-- ── Working the sheet ───────────────────────────────────────────────────────
create function public.admin_save_inspection(target uuid, checklist jsonb, dogs jsonb, photos text[], summary text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.can_work_inspection(target) then raise exception 'Staff only' using errcode = '42501'; end if;
  if (select status from public.inspections where id = target) <> 'scheduled' then raise exception 'This inspection is finished'; end if;
  if exists (select 1 from unnest(coalesce(photos, '{}')) ph where ph not like target::text || '/%') then raise exception 'Photos must be this inspection''s'; end if;
  update public.inspections set
    checklist = coalesce(admin_save_inspection.checklist, '[]'),
    dogs = coalesce(admin_save_inspection.dogs, '[]'),
    photos = coalesce(admin_save_inspection.photos, '{}'),
    summary = left(trim(coalesce(admin_save_inspection.summary, '')), 2000)
  where id = target;
end;
$$;

-- Record the result (after saving the sheet). Passed: the store is verified and its dogs marked inspected.
-- Failed: the store goes back to its owner with the summary.
create function public.admin_complete_inspection(target uuid, passed boolean)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  ins record;
  who text;
  month text := to_char(now() at time zone 'Africa/Lagos', 'FMMonth YYYY');
  checks jsonb;
  d jsonb;
begin
  if not public.can_work_inspection(target) then raise exception 'Staff only' using errcode = '42501'; end if;
  select i.*, s.public_id, s.name as store_name into ins from public.inspections i join public.stores s on s.id = i.store_id where i.id = target;
  if ins.status <> 'scheduled' then raise exception 'This inspection is finished'; end if;
  if jsonb_array_length(ins.checklist) = 0 or exists (select 1 from jsonb_array_elements(ins.checklist) c where c ->> 'ok' is null) then
    raise exception 'Mark every check first';
  end if;
  if not passed and length(trim(ins.summary)) < 10 then raise exception 'Write a summary for the store'; end if;
  select coalesce(nullif(p.full_name, ''), u.email) into who from auth.users u left join public.profiles p on p.id = u.id where u.id = coalesce(ins.inspector_id, auth.uid());

  update public.inspections set status = case when passed then 'passed'::public.inspection_status else 'failed'::public.inspection_status end, completed_at = now() where id = target;

  if passed then
    select coalesce(jsonb_agg(c ->> 'label'), '[]') into checks from jsonb_array_elements(ins.checklist) c where (c ->> 'ok')::boolean;
    update public.stores set status = 'verified', status_note = left(coalesce(nullif(trim(ins.summary), ''), 'Inspection passed'), 500), status_changed_at = now(),
      details = jsonb_set(coalesce(details, '{}'), '{inspection}', jsonb_build_object('status', 'passed', 'date', month, 'by', who || ', Dogeash', 'checks', checks))
    where id = ins.store_id;
    for d in select value from jsonb_array_elements(ins.dogs) loop
      if coalesce((d ->> 'seen')::boolean, false) then
        update public.dogs set
          level = coalesce((d ->> 'confirmed_level')::smallint, level),
          file = coalesce(file, '{}') || jsonb_build_object('inspected', 'Inspected ' || month || ' by Dogeash')
        where id = (d ->> 'id')::uuid and store_id = ins.store_id;
      end if;
    end loop;
  else
    update public.stores set status = 'draft', status_note = left(trim(ins.summary), 500), status_changed_at = now() where id = ins.store_id;
  end if;

  perform public.admin_log(case when passed then 'inspection.pass' else 'inspection.fail' end, 'store', ins.public_id,
    jsonb_build_object('inspector', who, 'note', ins.summary, 'checks', jsonb_array_length(ins.checklist)));
  perform public.notify(m.user_id, 'store',
    case when passed then ins.store_name || ' passed its inspection' else ins.store_name || ' didn''t pass its inspection' end,
    coalesce(nullif(trim(ins.summary), ''), case when passed then 'Your store is live. Put your dogs live from the dashboard.' else 'Open your dashboard for details.' end),
    '/dashboard', 'inspection:' || target)
  from public.store_members m where m.store_id = ins.store_id and m.role in ('owner', 'manager');
end;
$$;

-- ── Photos: a private bucket, staff only ────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inspection-photos', 'inspection-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function public.can_use_inspection_photo(path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select case when split_part(path, '/', 1) ~ '^[0-9a-f-]{36}$' then public.can_work_inspection(split_part(path, '/', 1)::uuid) else false end
$$;

create policy "Staff add inspection photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'inspection-photos' and public.can_use_inspection_photo(name));
create policy "Staff read inspection photos" on storage.objects for select to authenticated
  using (bucket_id = 'inspection-photos' and public.can_use_inspection_photo(name));
create policy "Staff remove inspection photos" on storage.objects for delete to authenticated
  using (bucket_id = 'inspection-photos' and public.can_use_inspection_photo(name));

-- ── Access ──────────────────────────────────────────────────────────────────
-- The table itself is only reached through the functions above
alter table public.inspections enable row level security;
revoke all on public.inspections from anon, authenticated;

revoke execute on function public.can_work_inspection(uuid) from public, anon;
revoke execute on function public.can_use_inspection_photo(text) from public, anon;
revoke execute on function public.admin_staff() from public, anon;
revoke execute on function public.admin_schedule_inspection(text, timestamptz, uuid, text) from public, anon;
revoke execute on function public.admin_cancel_inspection(uuid, text) from public, anon;
revoke execute on function public.admin_inspections() from public, anon;
revoke execute on function public.admin_inspection(uuid) from public, anon;
revoke execute on function public.my_store_inspection(uuid) from public, anon;
revoke execute on function public.admin_save_inspection(uuid, jsonb, jsonb, text[], text) from public, anon;
revoke execute on function public.admin_complete_inspection(uuid, boolean) from public, anon;
grant execute on function public.can_work_inspection(uuid) to authenticated;
grant execute on function public.can_use_inspection_photo(text) to authenticated;
grant execute on function public.admin_staff() to authenticated;
grant execute on function public.admin_schedule_inspection(text, timestamptz, uuid, text) to authenticated;
grant execute on function public.admin_cancel_inspection(uuid, text) to authenticated;
grant execute on function public.admin_inspections() to authenticated;
grant execute on function public.admin_inspection(uuid) to authenticated;
grant execute on function public.my_store_inspection(uuid) to authenticated;
grant execute on function public.admin_save_inspection(uuid, jsonb, jsonb, text[], text) to authenticated;
grant execute on function public.admin_complete_inspection(uuid, boolean) to authenticated;
