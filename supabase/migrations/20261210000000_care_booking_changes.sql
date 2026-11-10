-- Care bookings, 10 Nov: several services in one appointment, days up to three months ahead, and changing a
-- booking while the provider hasn't answered it yet. Runs after 20261209000000_nov9_batch.sql.
--
-- services holds everything asked for in the booking; service stays as the first of them, so older screens
-- and notifications keep working. A booking can be changed (services, day, time, place, note) by its buyer
-- only while it's "requested": once the provider confirms or declines it, it's fixed (cancel it instead).

alter table public.care_bookings
  add column services text[] not null default '{}' check (cardinality(services) <= 5);
update public.care_bookings set services = array[service] where cardinality(services) = 0;
grant insert (services) on public.care_bookings to authenticated;

-- Every rule a booking's time and services must meet, for a new booking and for a change. `skip` is the
-- booking being changed, so it doesn't clash with itself.
create function public.check_care_booking(pr_id uuid, buyer uuid, b_day date, b_slot text, b_place text, b_services text[], b_dog_key text, skip uuid)
returns void language plpgsql stable security definer set search_path = ''
as $$
declare
  pr record;
begin
  select * into pr from public.care_providers where id = pr_id;
  if not found or not pr.listed or not pr.taking_bookings then raise exception 'This provider isn''t taking bookings right now'; end if;
  if b_day <= current_date then raise exception 'Choose a day from tomorrow on'; end if;
  if b_day > current_date + 92 then raise exception 'Choose a day in the next three months'; end if;
  if not (extract(dow from b_day)::smallint = any (pr.weekdays)) then raise exception 'The provider doesn''t work on that day'; end if;
  if not (b_slot = any (pr.slots)) then raise exception 'Choose one of the provider''s times'; end if;
  if b_place = 'home' and not pr.home_visits then raise exception 'This provider doesn''t visit homes'; end if;
  if cardinality(b_services) < 1 then raise exception 'Choose at least one of the provider''s services'; end if;
  if cardinality(b_services) > 5 then raise exception 'Choose up to 5 of the provider''s services'; end if;
  if cardinality(pr.services) > 0 and not (b_services <@ pr.services) then raise exception 'Choose from the provider''s services'; end if;
  -- The time is full
  if (select count(*) from public.care_bookings where provider_id = pr_id and day = b_day and slot = b_slot
      and status in ('requested', 'confirmed') and id is distinct from skip) >= pr.slot_capacity then
    raise exception 'That time is already booked. Choose another';
  end if;
  -- The buyer can't be in two places at once
  if exists (select 1 from public.care_bookings where buyer_id = buyer and day = b_day and slot = b_slot
      and status in ('requested', 'confirmed') and id is distinct from skip) then
    raise exception 'You already have a care appointment at that time';
  end if;
  -- One booking at a time with the same provider for the same dog (book again once it's done)
  if exists (select 1 from public.care_bookings where buyer_id = buyer and provider_id = pr_id and status in ('requested', 'confirmed')
      and id is distinct from skip and coalesce(owned_dog_id::text, lower(dog_name)) is not distinct from b_dog_key) then
    raise exception 'You already have a booking with this provider for this dog';
  end if;
end;
$$;
revoke execute on function public.check_care_booking(uuid, uuid, date, text, text, text[], text, uuid) from public, anon, authenticated;

-- A list of services, cleaned: trimmed, no blanks, no repeats, in the order chosen
create function public.clean_services(list text[])
returns text[] language sql immutable set search_path = ''
as $$
  select coalesce(array_agg(s order by first), '{}') from (
    select trim(x) as s, min(ord) as first from unnest(list) with ordinality as t(x, ord)
    where length(trim(coalesce(x, ''))) between 2 and 80 group by trim(x)
  ) u
$$;

create or replace function public.prepare_care_booking()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.buyer_id := auth.uid();
  new.status := 'requested';
  new.provider_note := '';
  if new.buyer_id is null then raise exception 'Sign in first'; end if;
  if public.is_blocked() then raise exception 'Your account can''t make bookings right now'; end if;
  if public.is_provider_member(new.provider_id) then raise exception 'You manage this listing, so you can''t book it'; end if;
  new.services := public.clean_services(case when cardinality(new.services) > 0 then new.services else array[new.service] end);
  new.service := coalesce(new.services[1], new.service);
  if new.owned_dog_id is not null then
    select name into new.dog_name from public.owned_dogs where id = new.owned_dog_id and owner_id = new.buyer_id;
    if new.dog_name is null then raise exception 'Not your dog'; end if;
  else
    new.dog_name := left(trim(coalesce(new.dog_name, '')), 40);
    new.share_record := false;
  end if;
  perform public.check_care_booking(new.provider_id, new.buyer_id, new.day, new.slot, new.place, new.services,
    coalesce(new.owned_dog_id::text, lower(new.dog_name)), null);
  if (select count(*) from public.care_bookings where buyer_id = new.buyer_id and status = 'requested') >= 10 then
    raise exception 'You have 10 bookings waiting for an answer. Wait for some replies first';
  end if;
  select coalesce(nullif(full_name, ''), 'A buyer'), nullif(phone, '') into new.buyer_name, new.buyer_phone from public.profiles where id = new.buyer_id;
  return new;
end;
$$;

-- The provider hears about every service asked for
create or replace function public.notify_care_booking()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform public.notify(m.user_id, 'care', 'Booking request: ' || array_to_string(new.services, ', '),
    new.buyer_name || U&' \00B7 ' || to_char(new.day, 'Dy DD Mon') || ', ' || new.slot || case when new.place = 'home' then U&' \00B7 at their home' else '' end,
    '/provider', 'care-booking:' || new.id)
  from public.care_provider_members m where m.provider_id = new.provider_id;
  return new;
end;
$$;

-- The buyer changes a booking the provider hasn't answered yet. The same rules as a new booking apply, and
-- the provider is told what it is now.
create function public.edit_care_booking(booking uuid, new_services text[], new_day date, new_slot text, new_place text default 'premises', new_note text default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  b public.care_bookings;
  list text[] := public.clean_services(new_services);
begin
  select * into b from public.care_bookings where id = booking and buyer_id = auth.uid() for update;
  if b.id is null then raise exception 'No such booking' using errcode = '42501'; end if;
  if b.status <> 'requested' then raise exception 'The provider has already answered this booking, so it can''t be changed. Cancel it and book again instead'; end if;
  if new_place not in ('premises', 'home') then raise exception 'Choose where'; end if;
  perform public.check_care_booking(b.provider_id, b.buyer_id, new_day, new_slot, new_place, list,
    coalesce(b.owned_dog_id::text, lower(b.dog_name)), b.id);
  update public.care_bookings set services = list, service = list[1], day = new_day, slot = new_slot, place = new_place,
    note = coalesce(left(new_note, 500), note)
  where id = b.id;
  perform public.notify(m.user_id, 'care', 'Booking changed: ' || array_to_string(list, ', '),
    b.buyer_name || U&' \00B7 now ' || to_char(new_day, 'Dy DD Mon') || ', ' || new_slot || case when new_place = 'home' then U&' \00B7 at their home' else '' end,
    '/provider', 'care-booking:' || b.id)
  from public.care_provider_members m where m.provider_id = b.provider_id;
end;
$$;
revoke execute on function public.edit_care_booking(uuid, text[], date, text, text, text) from public, anon;
grant execute on function public.edit_care_booking(uuid, text[], date, text, text, text) to authenticated;

-- The provider's list shows every service asked for
create or replace function public.provider_bookings(provider uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_provider_member(provider) then raise exception 'You don''t manage this listing' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(x order by x.day, x.slot) from (
    select b.id, b.service, b.services, b.day, b.slot, b.place, b.note, b.dog_name, b.share_record and b.owned_dog_id is not null as can_add_record,
      b.status, b.provider_note, b.buyer_name, case when b.status in ('requested', 'confirmed') then b.buyer_phone end as buyer_phone,
      b.created_at, b.updated_at, (select count(*) from public.owned_dog_records r where r.care_booking_id = b.id) as records_added
    from public.care_bookings b where b.provider_id = provider and b.day >= current_date - 90
  ) x), '[]'::jsonb);
end;
$$;
