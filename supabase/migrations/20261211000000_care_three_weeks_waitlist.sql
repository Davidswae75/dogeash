-- Care bookings, 10 Nov (second part): runs after 20261210000000_care_booking_changes.sql.
--  1. Days up to three weeks ahead (not three months), counted on Lagos time.
--  2. A provider marks an appointment done on its day or after, never before.
--  3. "Let me know when a time frees up": a buyer who finds a provider fully booked joins its waiting list;
--     when a booking in the next three weeks is cancelled, declined or moved, everyone waiting is told once.

-- -- 1. Three weeks --
create or replace function public.check_care_booking(pr_id uuid, buyer uuid, b_day date, b_slot text, b_place text, b_services text[], b_dog_key text, skip uuid)
returns void language plpgsql stable security definer set search_path = ''
as $$
declare
  pr record;
  today date := (now() at time zone 'Africa/Lagos')::date;
begin
  select * into pr from public.care_providers where id = pr_id;
  if not found or not pr.listed or not pr.taking_bookings then raise exception 'This provider isn''t taking bookings right now'; end if;
  if b_day <= today then raise exception 'Choose a day from tomorrow on'; end if;
  if b_day > today + 21 then raise exception 'Choose a day in the next three weeks'; end if;
  if not (extract(dow from b_day)::smallint = any (pr.weekdays)) then raise exception 'The provider doesn''t work on that day'; end if;
  if not (b_slot = any (pr.slots)) then raise exception 'Choose one of the provider''s times'; end if;
  if b_place = 'home' and not pr.home_visits then raise exception 'This provider doesn''t visit homes'; end if;
  if cardinality(b_services) < 1 then raise exception 'Choose at least one of the provider''s services'; end if;
  if cardinality(b_services) > 5 then raise exception 'Choose up to 5 of the provider''s services'; end if;
  if cardinality(pr.services) > 0 and not (b_services <@ pr.services) then raise exception 'Choose from the provider''s services'; end if;
  if (select count(*) from public.care_bookings where provider_id = pr_id and day = b_day and slot = b_slot
      and status in ('requested', 'confirmed') and id is distinct from skip) >= pr.slot_capacity then
    raise exception 'That time is already booked. Choose another';
  end if;
  if exists (select 1 from public.care_bookings where buyer_id = buyer and day = b_day and slot = b_slot
      and status in ('requested', 'confirmed') and id is distinct from skip) then
    raise exception 'You already have a care appointment at that time';
  end if;
  if exists (select 1 from public.care_bookings where buyer_id = buyer and provider_id = pr_id and status in ('requested', 'confirmed')
      and id is distinct from skip and coalesce(owned_dog_id::text, lower(dog_name)) is not distinct from b_dog_key) then
    raise exception 'You already have a booking with this provider for this dog';
  end if;
end;
$$;

-- -- 2. Done on the day or after --
-- (The same function as before, with that one rule added.) Past days stay allowed so a provider can still close
-- an appointment they forgot to mark; until it's done, the buyer can't book that provider again for the dog.
create or replace function public.set_care_booking_status(booking uuid, to_status public.care_booking_status, answer_note text default '')
returns void language plpgsql security definer set search_path = ''
as $$
declare
  b public.care_bookings;
  pname text;
  me uuid := auth.uid();
begin
  select * into b from public.care_bookings where id = booking for update;
  if b.id is null then raise exception 'No such booking' using errcode = 'P0001'; end if;
  select name into pname from public.care_providers where id = b.provider_id;

  if b.buyer_id = me and to_status = 'cancelled' then
    if b.status not in ('requested', 'confirmed') then raise exception 'This booking can''t be cancelled now' using errcode = 'P0001'; end if;
    update public.care_bookings set status = 'cancelled' where id = b.id;
    perform public.notify(m.user_id, 'care', 'Booking cancelled: ' || b.service,
      b.buyer_name || ' cancelled ' || to_char(b.day, 'Dy DD Mon') || ', ' || b.slot || '.', '/provider', 'care-booking:' || b.id)
    from public.care_provider_members m where m.provider_id = b.provider_id;
  elsif public.is_provider_member(b.provider_id) and to_status in ('confirmed', 'declined', 'done') then
    if to_status in ('confirmed', 'declined') and b.status <> 'requested' then raise exception 'This booking has already been answered' using errcode = 'P0001'; end if;
    if to_status = 'done' and b.status <> 'confirmed' then raise exception 'Confirm the booking first' using errcode = 'P0001'; end if;
    if to_status = 'done' and b.day > (now() at time zone 'Africa/Lagos')::date then
      raise exception 'You can mark it done on the day of the appointment' using errcode = 'P0001';
    end if;
    update public.care_bookings set status = to_status, provider_note = left(trim(coalesce(answer_note, '')), 300) where id = b.id;
    perform public.notify(b.buyer_id, 'care',
      case to_status when 'confirmed' then pname || ' confirmed your booking' when 'declined' then pname || ' can''t make it' else pname || ': appointment done' end,
      b.service || U&' \00B7 ' || to_char(b.day, 'Dy DD Mon') || ', ' || b.slot || coalesce(nullif('. ' || left(trim(coalesce(answer_note, '')), 200), '. '), ''),
      '/account/bookings', 'care-booking:' || b.id);
  else
    raise exception 'You can''t change this booking' using errcode = '42501';
  end if;
end;
$$;

-- -- 3. Waiting list --
create table public.care_waitlist (
  provider_id uuid not null references public.care_providers (id) on delete cascade,
  buyer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (provider_id, buyer_id)
);
alter table public.care_waitlist enable row level security;
revoke all on public.care_waitlist from anon, authenticated;
grant select, delete on public.care_waitlist to authenticated;
create policy "Buyers see their waiting lists" on public.care_waitlist for select to authenticated using (buyer_id = (select auth.uid()));
create policy "Buyers leave waiting lists" on public.care_waitlist for delete to authenticated using (buyer_id = (select auth.uid()));

-- Join by the provider's public id (CARE-01); joining twice is fine
create function public.join_care_waitlist(provider text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select id into pid from public.care_providers where public_id = provider and listed;
  if pid is null then raise exception 'This provider isn''t taking bookings right now'; end if;
  if public.is_provider_member(pid) then raise exception 'You manage this listing, so you can''t book it'; end if;
  insert into public.care_waitlist (provider_id, buyer_id) values (pid, auth.uid()) on conflict do nothing;
end;
$$;
revoke execute on function public.join_care_waitlist(text) from public, anon;
grant execute on function public.join_care_waitlist(text) to authenticated;

-- A time in the next three weeks is free again (cancelled, declined, or moved to another time): tell everyone
-- waiting for this provider, once, and take them off the list
create function public.care_time_freed()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  today date := (now() at time zone 'Africa/Lagos')::date;
  pname text;
  pslug text;
begin
  if old.status not in ('requested', 'confirmed') or old.day <= today or old.day > today + 21 then return new; end if;
  if not (new.status in ('cancelled', 'declined') or (new.status = old.status and (new.day, new.slot) is distinct from (old.day, old.slot))) then
    return new;
  end if;
  select name, slug into pname, pslug from public.care_providers where id = old.provider_id;
  perform public.notify(w.buyer_id, 'care', 'A time opened up with ' || pname,
    to_char(old.day, 'Dy DD Mon') || ', ' || old.slot || ' is free now. Book it before someone else does.',
    '/care/' || pslug, 'care-waitlist:' || old.provider_id || ':' || old.day || ':' || old.slot)
  from public.care_waitlist w where w.provider_id = old.provider_id and w.buyer_id <> old.buyer_id;
  delete from public.care_waitlist where provider_id = old.provider_id and buyer_id <> old.buyer_id;
  return new;
end;
$$;
create trigger care_bookings_time_freed after update of status, day, slot on public.care_bookings for each row execute function public.care_time_freed();
revoke execute on function public.care_time_freed() from public, anon, authenticated;
