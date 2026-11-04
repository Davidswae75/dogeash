-- Admins change a store's status from the admin overview: approve (verified), decline (back to draft),
-- mark in review, suspend, or restore. Each change keeps a note for the store (required when declining or
-- suspending), is written to the audit log, and tells the store's owners and managers in the bell.
-- Approving also records Dogeash's inspection, so the store page shows it as inspected.

alter type public.notification_kind add value if not exists 'store';

alter table public.stores
  add column status_note text not null default '' check (length(status_note) <= 500),
  add column status_changed_at timestamptz;

-- Dogeash's parts of a store's details (inspection, reviews, figures) stay protected from stores,
-- but admins with a one-time code may now set them too (approving writes the inspection record)
create or replace function public.protect_store_details()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  owned text[] := array['inspection', 'reviewSamples', 'dogsPlaced', 'replies'];
  k text;
begin
  if auth.uid() is null or public.is_staff('{admin}') then return new; end if;  -- the seed, the SQL editor, or an admin
  new.details := coalesce(new.details, '{}'::jsonb) - owned;
  if tg_op = 'UPDATE' then
    foreach k in array owned loop
      if old.details ? k then new.details := jsonb_set(new.details, array[k], old.details -> k); end if;
    end loop;
  end if;
  return new;
end;
$$;

-- Every store, any status, newest first, with its owner and dogs: the admin overview's Stores panel
create function public.admin_stores()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
    select s.public_id, s.slug, s.name, s.city, s.status, s.status_note, s.status_changed_at, s.created_at,
      s.rating, s.reviews_count,
      (select coalesce(nullif(p.full_name, ''), u.email) from public.store_members m
         join auth.users u on u.id = m.user_id left join public.profiles p on p.id = m.user_id
         where m.store_id = s.id and m.role = 'owner' order by m.created_at limit 1) as owner,
      (select count(*) from public.dogs d where d.store_id = s.id) as dogs,
      (select count(*) from public.dogs d where d.store_id = s.id and d.status in ('available', 'reserved')) as live_dogs
    from public.stores s
  ) x);
end;
$$;

-- Change a store's status (by its public id, like STR-001), with a note the store sees
create function public.admin_set_store_status(target text, next public.store_status, note text default '')
returns void language plpgsql security definer set search_path = ''
as $$
declare
  st record;
  why text := trim(coalesce(note, ''));
  title text;
begin
  perform public.require_staff('{admin}');
  select id, name, status, details into st from public.stores where public_id = target;
  if st is null then raise exception 'No store %', target; end if;
  if st.status = next then raise exception 'The store is already %', next; end if;
  if next in ('draft', 'suspended') and why = '' then raise exception 'Give the store a reason'; end if;

  update public.stores set
    status = next,
    status_note = left(why, 500),
    status_changed_at = now(),
    details = case
      when next = 'verified' and coalesce(details -> 'inspection' ->> 'status', '') <> 'passed' then
        jsonb_set(coalesce(details, '{}'), '{inspection}', jsonb_build_object(
          'status', 'passed',
          'date', to_char(now() at time zone 'Africa/Lagos', 'FMMonth YYYY'),
          'by', 'Dogeash inspection team',
          'checks', coalesce(details -> 'inspection' -> 'checks', '[]')))
      else details end
  where id = st.id;

  perform public.admin_log('store.' || next, 'store', target, jsonb_build_object('from', st.status, 'to', next, 'note', why));

  title := case next
    when 'verified' then st.name || ' is approved'
    when 'draft' then st.name || ' was sent back'
    when 'in_review' then st.name || ' is in review'
    else st.name || ' is suspended' end;
  perform public.notify(m.user_id, 'store', title,
    coalesce(nullif(why, ''), case next
      when 'verified' then 'Your store is live on Dogeash. Put your dogs live from the dashboard.'
      when 'in_review' then 'Dogeash is reviewing your store. We''ll tell you here when there''s a decision.'
      else 'Open your dashboard for details.' end),
    '/dashboard', 'store-status:' || st.id)
  from public.store_members m where m.store_id = st.id and m.role in ('owner', 'manager');
end;
$$;

revoke execute on function public.admin_stores() from public, anon;
revoke execute on function public.admin_set_store_status(text, public.store_status, text) from public, anon;
grant execute on function public.admin_stores() to authenticated;
grant execute on function public.admin_set_store_status(text, public.store_status, text) to authenticated;
