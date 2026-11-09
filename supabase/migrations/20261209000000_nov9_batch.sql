-- 9 Nov batch: dates that make sense, care services and bookings that don't clash, reserved and sold dogs on
-- shortlists, one visit per time, pinned dogs on a store's page, and providers' photos and contact details.
-- Each section says what it's for. Plain ASCII.

-- -- 1. Dates in a dog's record --
-- A next-due date (booster, next session, reminder) can't be before the date it was done; "done" can't be in the
-- future; a dog can't have joined you before it was born. Checked for new and changed lines (NOT VALID leaves
-- anything already saved alone).
alter table public.owned_dog_records
  add constraint owned_dog_records_due_after_done check (due_on is null or done_on is null or due_on >= done_on) not valid,
  add constraint owned_dog_records_done_not_future check (done_on is null or done_on <= current_date) not valid;
alter table public.owned_dogs
  add constraint owned_dogs_got_after_born check (got_on is null or born_on is null or got_on >= born_on) not valid;

-- -- 2. Care: services, clashes, repeats and how many clients a time takes --
-- A provider offers one or more services (from any kind of care: a vet who also grooms). Existing providers
-- start with their kind's usual services. `slot_capacity` is how many bookings one time can take (1 = one
-- client at a time).
alter table public.care_providers
  add column services text[] not null default '{}' check (cardinality(services) <= 12),
  add column slot_capacity smallint not null default 1 check (slot_capacity between 1 and 20);
update public.care_providers set services = case type
  when 'vet' then array['Health check', 'Vaccination', 'Microchip scan', 'Tick and worm treatment']
  when 'trainer' then array['Handover session', 'Refresher training', 'Obedience course']
  when 'groomer' then array['Bath and groom', 'Kennel deep clean', 'Tick treatment wash']
  when 'builder' then array['Site visit and quote', 'Kennel run install']
  when 'equipment' then array['Harness and collar fitting', 'Muzzle fitting', 'Gear consultation']
  else array['Overnight stay', 'Week-long stay'] end
where cardinality(services) = 0;

-- The provider chooses their services and how many clients each time takes
create function public.provider_save_services(provider uuid, list text[], capacity smallint default 1)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  clean text[];
begin
  if not public.is_provider_member(provider) then raise exception 'You don''t manage this listing' using errcode = '42501'; end if;
  select coalesce(array_agg(distinct left(trim(x), 40)), '{}') into clean from unnest(coalesce(list, '{}')) x where length(trim(x)) > 1;
  if cardinality(clean) = 0 then raise exception 'Choose at least one service' using errcode = 'P0001'; end if;
  if cardinality(clean) > 12 then raise exception 'Up to 12 services' using errcode = 'P0001'; end if;
  update public.care_providers set services = clean, slot_capacity = greatest(1, least(20, coalesce(capacity, 1))) where id = provider;
end;
$$;
revoke execute on function public.provider_save_services(uuid, text[], smallint) from public, anon;
grant execute on function public.provider_save_services(uuid, text[], smallint) to authenticated;

-- Times that are full, for the booking dialog (no names: just which day and time can't be booked)
create function public.care_full_slots(provider text)
returns table (day date, slot text)
language sql stable security definer set search_path = ''
as $$
  select b.day, b.slot from public.care_bookings b join public.care_providers p on p.id = b.provider_id
  where p.public_id = provider and b.status in ('requested', 'confirmed') and b.day > current_date
  group by b.day, b.slot, p.slot_capacity having count(*) >= p.slot_capacity
$$;
grant execute on function public.care_full_slots(text) to anon, authenticated;

-- A new care booking, now also checking: the service is one the provider offers; the time isn't full; the buyer
-- isn't already booked anywhere at that time; and they don't already have this provider booked for this dog.
create or replace function public.prepare_care_booking()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  pr record;
begin
  new.buyer_id := auth.uid();
  new.status := 'requested';
  new.provider_note := '';
  if new.buyer_id is null then raise exception 'Sign in first'; end if;
  if public.is_blocked() then raise exception 'Your account can''t make bookings right now'; end if;
  select * into pr from public.care_providers where id = new.provider_id;
  if public.is_provider_member(new.provider_id) then raise exception 'You manage this listing, so you can''t book it'; end if;
  if not pr.listed then raise exception 'This provider isn''t taking bookings right now'; end if;
  if not pr.taking_bookings then raise exception 'This provider isn''t taking bookings right now'; end if;
  if new.day <= current_date then raise exception 'Choose a day from tomorrow on'; end if;
  if new.day > current_date + 60 then raise exception 'Choose a day in the next two months'; end if;
  if not (extract(dow from new.day)::smallint = any (pr.weekdays)) then raise exception 'The provider doesn''t work on that day'; end if;
  if not (new.slot = any (pr.slots)) then raise exception 'Choose one of the provider''s times'; end if;
  if new.place = 'home' and not pr.home_visits then raise exception 'This provider doesn''t visit homes'; end if;
  if cardinality(pr.services) > 0 and not (new.service = any (pr.services)) then raise exception 'Choose one of the provider''s services'; end if;
  if new.owned_dog_id is not null then
    select name into new.dog_name from public.owned_dogs where id = new.owned_dog_id and owner_id = new.buyer_id;
    if new.dog_name is null then raise exception 'Not your dog'; end if;
  else
    new.dog_name := left(trim(coalesce(new.dog_name, '')), 40);
    new.share_record := false;
  end if;
  -- The time is full
  if (select count(*) from public.care_bookings where provider_id = new.provider_id and day = new.day and slot = new.slot
      and status in ('requested', 'confirmed')) >= pr.slot_capacity then
    raise exception 'That time is already booked. Choose another';
  end if;
  -- The buyer can't be in two places at once
  if exists (select 1 from public.care_bookings where buyer_id = new.buyer_id and day = new.day and slot = new.slot and status in ('requested', 'confirmed')) then
    raise exception 'You already have a care appointment at that time';
  end if;
  -- One booking at a time with the same provider for the same dog (book again once it's done)
  if exists (select 1 from public.care_bookings where buyer_id = new.buyer_id and provider_id = new.provider_id and status in ('requested', 'confirmed')
      and coalesce(owned_dog_id::text, lower(dog_name)) is not distinct from coalesce(new.owned_dog_id::text, lower(new.dog_name))) then
    raise exception 'You already have a booking with this provider for this dog';
  end if;
  if (select count(*) from public.care_bookings where buyer_id = new.buyer_id and status = 'requested') >= 10 then
    raise exception 'You have 10 bookings waiting for an answer. Wait for some replies first';
  end if;
  select coalesce(nullif(full_name, ''), 'A buyer'), nullif(phone, '') into new.buyer_name, new.buyer_phone from public.profiles where id = new.buyer_id;
  return new;
end;
$$;

-- -- 3. Sold dogs leave shortlists --
-- When a dog is sold it's off the market, so it leaves every shortlist (after the "sold" notification, which
-- the dogs_notify trigger sends first: triggers run in name order). A reserved dog stays; the shortlist offers
-- to remove it.
create function public.drop_sold_from_shortlists()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'sold' and old.status is distinct from 'sold' then
    delete from public.shortlist_items where dog_id = new.id;
  end if;
  return new;
end;
$$;
create trigger dogs_zz_sold_leaves_shortlists after update of status on public.dogs for each row execute function public.drop_sold_from_shortlists();
revoke execute on function public.drop_sold_from_shortlists() from public, anon, authenticated;

-- -- 4. One visit per time (stores choose how many) --
-- A requested or confirmed kennel visit takes its time: nobody else can book it. Declined or cancelled, it's
-- free again. A store that hosts several visitors at once raises visit_capacity. A buyer also can't have two
-- visits at the same time.
alter table public.stores add column visit_capacity smallint not null default 1 check (visit_capacity between 1 and 20);
grant update (visit_capacity) on public.stores to authenticated;

create or replace function public.check_visit_time()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  st record;
begin
  select visit_days, visit_slots, home_visits, visits_paused, visit_capacity into st from public.stores where id = new.store_id;
  if st is null then return new; end if;
  if st.visits_paused then raise exception 'This store isn''t taking visits right now'; end if;
  if not (extract(dow from new.day)::smallint = any (st.visit_days)) then raise exception 'The store doesn''t take visits on that day'; end if;
  if not (new.slot = any (st.visit_slots)) then raise exception 'Choose one of the store''s visit times'; end if;
  if new.place = 'home' and not st.home_visits then raise exception 'This store only takes visits at the kennel'; end if;
  if (select count(*) from public.visits where store_id = new.store_id and day = new.day and slot = new.slot
      and status in ('requested', 'confirmed')) >= st.visit_capacity then
    raise exception 'That time is already booked. Choose another';
  end if;
  if exists (select 1 from public.visits where buyer_id = new.buyer_id and day = new.day and slot = new.slot and status in ('requested', 'confirmed')) then
    raise exception 'You already have a visit at that time';
  end if;
  return new;
end;
$$;

-- A store's times that are full, for the booking dialog (no names)
create function public.store_full_slots(store text)
returns table (day date, slot text)
language sql stable security definer set search_path = ''
as $$
  select v.day, v.slot from public.visits v join public.stores s on s.id = v.store_id
  where s.public_id = store and v.status in ('requested', 'confirmed') and v.day >= current_date
  group by v.day, v.slot, s.visit_capacity having count(*) >= s.visit_capacity
$$;
grant execute on function public.store_full_slots(text) to anon, authenticated;

-- -- 5. Pinned dogs: up to 3 a store puts first on its page --
-- pinned_at orders them (first pinned shows first). A dog that's sold or withdrawn drops its pin.
alter table public.dogs add column pinned_at timestamptz;
grant update (pinned_at) on public.dogs to authenticated;

create function public.check_dog_pin()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status in ('sold', 'withdrawn', 'draft', 'pending_review') then
    new.pinned_at := null;
  elsif new.pinned_at is not null and old.pinned_at is null then
    if (select count(*) from public.dogs where store_id = new.store_id and pinned_at is not null and id <> new.id) >= 3 then
      raise exception 'pins_full: a store can pin up to 3 dogs';
    end if;
  end if;
  return new;
end;
$$;
create trigger dogs_check_pin before update on public.dogs for each row execute function public.check_dog_pin();
revoke execute on function public.check_dog_pin() from public, anon, authenticated;

-- -- 6. Providers' photos, workplace, history and contact --
-- Public on the provider's page: a profile photo, up to 8 photos of the workplace or their work, the workplace
-- address, the year they started and a short history. The phone, WhatsApp and email are for signed-in people
-- only (care_provider_contacts), so they aren't scraped from the open page.
alter table public.care_providers
  add column photo_path text,
  add column gallery_paths text[] not null default '{}' check (cardinality(gallery_paths) <= 8),
  add column address text not null default '' check (length(address) <= 200),
  add column started_year smallint check (started_year is null or started_year between 1950 and 2100),
  add column history jsonb not null default '[]' check (jsonb_typeof(history) = 'array' and jsonb_array_length(history) <= 8),
  add constraint care_providers_photo_own_folder check (photo_path is null or photo_path like id::text || '/%');

create table public.care_provider_contacts (
  provider_id uuid primary key references public.care_providers (id) on delete cascade,
  phone text not null default '' check (length(phone) <= 30),
  whatsapp text not null default '' check (length(whatsapp) <= 30),
  email text not null default '' check (length(email) <= 120),
  updated_at timestamptz not null default now()
);
alter table public.care_provider_contacts enable row level security;
revoke all on public.care_provider_contacts from anon, authenticated;
grant select on public.care_provider_contacts to authenticated;
create policy "Signed-in people read provider contacts" on public.care_provider_contacts for select to authenticated using (true);

-- The member saves all of it in one go; photo paths must be in the provider's own folder
create function public.provider_save_details(provider uuid, d jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  folder text := provider::text || '/';
  gallery text[];
begin
  if not public.is_provider_member(provider) then raise exception 'You don''t manage this listing' using errcode = '42501'; end if;
  gallery := coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(d -> 'gallery', '[]')) x), '{}');
  if cardinality(gallery) > 8 then raise exception 'Up to 8 photos'; end if;
  if exists (select 1 from unnest(gallery) g where g not like folder || '%') or (d ->> 'photo' is not null and d ->> 'photo' not like folder || '%') then
    raise exception 'Photos must be your own uploads';
  end if;
  if jsonb_array_length(coalesce(d -> 'history', '[]')) > 8 then raise exception 'Up to 8 milestones'; end if;
  update public.care_providers set
    photo_path = d ->> 'photo',
    gallery_paths = gallery,
    address = left(trim(coalesce(d ->> 'address', '')), 200),
    started_year = nullif(d ->> 'startedYear', '')::smallint,
    history = coalesce((select jsonb_agg(jsonb_build_object('year', left(trim(coalesce(h ->> 'year', '')), 9), 'text', left(trim(coalesce(h ->> 'text', '')), 200))) from jsonb_array_elements(coalesce(d -> 'history', '[]')) h where length(trim(coalesce(h ->> 'text', ''))) > 0), '[]')
  where id = provider;
  insert into public.care_provider_contacts (provider_id, phone, whatsapp, email)
  values (provider, left(trim(coalesce(d ->> 'phone', '')), 30), left(trim(coalesce(d ->> 'whatsapp', '')), 30), lower(left(trim(coalesce(d ->> 'email', '')), 120)))
  on conflict (provider_id) do update set phone = excluded.phone, whatsapp = excluded.whatsapp, email = excluded.email, updated_at = now();
end;
$$;
revoke execute on function public.provider_save_details(uuid, jsonb) from public, anon;
grant execute on function public.provider_save_details(uuid, jsonb) to authenticated;

-- Photos live in the public care-media bucket, one folder per provider (its database id)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('care-media', 'care-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function public.can_manage_care_media(path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.care_provider_members m where m.user_id = auth.uid() and m.provider_id::text = split_part(path, '/', 1))
$$;
revoke execute on function public.can_manage_care_media(text) from public, anon;
grant execute on function public.can_manage_care_media(text) to authenticated;

create policy "Providers add their photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'care-media' and public.can_manage_care_media(name));
create policy "Providers replace their photos" on storage.objects for update to authenticated
  using (bucket_id = 'care-media' and public.can_manage_care_media(name))
  with check (bucket_id = 'care-media' and public.can_manage_care_media(name));
create policy "Providers remove their photos" on storage.objects for delete to authenticated
  using (bucket_id = 'care-media' and public.can_manage_care_media(name));
create policy "Providers list their photos" on storage.objects for select to authenticated
  using (bucket_id = 'care-media' and public.can_manage_care_media(name));
