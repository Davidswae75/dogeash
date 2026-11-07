-- Care providers get their own side of Dogeash: vets, trainers, groomers and the rest manage their listing,
-- answer care bookings, and (with the dog owner's permission, per booking) add what they did to the dog's record.
--
-- How a provider gets in: Dogeash invites someone by email to manage a listing (Admin -> Care directory).
-- The invitation waits in their account until they accept. Listings stay Dogeash-checked: the name, type,
-- city, credential and the "verified" badge are Dogeash's; the provider edits the rest.
-- Plain ASCII, so copying can't garble it.

alter type public.notification_kind add value if not exists 'care';

-- -- The listing: what the provider writes, and when they take bookings --
alter table public.care_providers
  add column about text not null default '' check (length(about) <= 800),
  add column hours text not null default '' check (length(hours) <= 120),
  add column weekdays smallint[] not null default '{1,2,3,4,5,6}' check (weekdays <@ '{0,1,2,3,4,5,6}' and cardinality(weekdays) between 1 and 7),
  add column slots text[] not null default '{9:00,11:00,13:00,15:00,17:00}' check (cardinality(slots) between 1 and 12),
  add column taking_bookings boolean not null default true;

-- -- Who manages a listing --
create table public.care_provider_members (
  provider_id uuid not null references public.care_providers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (provider_id, user_id)
);
create index care_provider_members_user_idx on public.care_provider_members (user_id);

create table public.care_provider_invites (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.care_providers (id) on delete cascade,
  email text not null check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (provider_id, email)
);
create index care_provider_invites_email_idx on public.care_provider_invites (email);

create function public.is_provider_member(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.care_provider_members m where m.provider_id = target and m.user_id = (select auth.uid())) $$;

alter table public.care_provider_members enable row level security;
alter table public.care_provider_invites enable row level security;
revoke all on public.care_provider_members, public.care_provider_invites from anon, authenticated;
grant select on public.care_provider_members to authenticated;
grant select, delete on public.care_provider_invites to authenticated;
create policy "People see the listings they manage" on public.care_provider_members for select to authenticated using (user_id = (select auth.uid()));
create policy "Staff see who manages listings" on public.care_provider_members for select to authenticated using (public.is_staff('{admin}'));
create policy "The invited person and staff see an invitation" on public.care_provider_invites for select to authenticated
  using (email = public.my_email() or public.is_staff('{admin}'));
create policy "The invited person declines, staff withdraw" on public.care_provider_invites for delete to authenticated
  using (email = public.my_email() or public.is_staff('{admin}'));

-- Dogeash invites someone to manage a listing (a bell notification if they already have an account)
create function public.admin_invite_provider(provider text, invite_email text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  e text := lower(trim(coalesce(invite_email, '')));
  invitee uuid;
  p record;
begin
  perform public.require_staff('{admin}');
  if e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That email doesn''t look right' using errcode = 'P0001'; end if;
  select * into p from public.care_providers where public_id = provider;
  if p.id is null then raise exception 'No such provider' using errcode = 'P0001'; end if;
  if exists (select 1 from public.care_provider_members m join auth.users u on u.id = m.user_id where m.provider_id = p.id and lower(u.email) = e) then
    raise exception 'That person already manages this listing' using errcode = 'P0001';
  end if;
  insert into public.care_provider_invites (provider_id, email, invited_by) values (p.id, e, auth.uid())
  on conflict (provider_id, email) do update set created_at = now(), invited_by = excluded.invited_by;
  select id into invitee from auth.users where lower(email) = e;
  if invitee is not null then
    perform public.notify(invitee, 'care', 'Manage ' || p.name || ' on Dogeash',
      'Dogeash invited you to manage this listing: answer bookings and keep its details up to date. Accept from your account.', '/account', 'provider-invite:' || p.id);
  end if;
  perform public.admin_log('provider_invite', 'care_provider', p.public_id, jsonb_build_object('email', e));
end;
$$;

-- Who manages each listing, and who's invited (for the admin's care directory)
create function public.admin_provider_managers()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return jsonb_build_object(
    'members', coalesce((select jsonb_agg(jsonb_build_object('provider', p.public_id, 'name', coalesce(nullif(pr.full_name, ''), u.email), 'email', u.email))
      from public.care_provider_members m join public.care_providers p on p.id = m.provider_id
      join auth.users u on u.id = m.user_id left join public.profiles pr on pr.id = m.user_id), '[]'::jsonb),
    'invites', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'provider', p.public_id, 'email', i.email, 'createdAt', i.created_at))
      from public.care_provider_invites i join public.care_providers p on p.id = i.provider_id), '[]'::jsonb)
  );
end;
$$;

-- Invitations waiting for me
create function public.my_provider_invites()
returns table (id uuid, provider_name text, provider_type public.care_type, provider_city text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select i.id, p.name, p.type, p.city, i.created_at
  from public.care_provider_invites i join public.care_providers p on p.id = i.provider_id
  where i.email = public.my_email() order by i.created_at desc
$$;

-- Accept: I manage the listing from now on. Returns its public id.
create function public.accept_provider_invite(target uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  inv record;
begin
  select * into inv from public.care_provider_invites where id = target and email = public.my_email();
  if inv.id is null then raise exception 'This invitation isn''t for you, or it was withdrawn' using errcode = 'P0001'; end if;
  insert into public.care_provider_members (provider_id, user_id) values (inv.provider_id, auth.uid()) on conflict do nothing;
  delete from public.care_provider_invites where id = target;
  update public.notifications set read_at = now() where user_id = auth.uid() and topic = 'provider-invite:' || inv.provider_id and read_at is null;
  return (select public_id from public.care_providers where id = inv.provider_id);
end;
$$;

-- The provider edits their listing: the details buyers read and when they take bookings.
-- Name, type, city, credential and the verified badge stay with Dogeash.
create function public.provider_save_profile(provider uuid, p jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_provider_member(provider) then raise exception 'You don''t manage this listing' using errcode = '42501'; end if;
  update public.care_providers set
    person = nullif(left(trim(coalesce(p ->> 'person', '')), 80), ''),
    areas = left(trim(coalesce(p ->> 'areas', '')), 120),
    about = left(trim(coalesce(p ->> 'about', '')), 800),
    hours = left(trim(coalesce(p ->> 'hours', '')), 120),
    price_from = greatest(0, coalesce((p ->> 'priceFrom')::bigint, price_from)),
    home_visits = coalesce((p ->> 'homeVisits')::boolean, home_visits),
    taking_bookings = coalesce((p ->> 'takingBookings')::boolean, taking_bookings),
    weekdays = coalesce((select array_agg(distinct x::smallint order by x::smallint) from jsonb_array_elements_text(p -> 'weekdays') x), weekdays),
    slots = coalesce((select array_agg(x order by x) from jsonb_array_elements_text(p -> 'slots') x where x ~ '^[0-9]{1,2}:[0-9]{2}$'), slots)
  where id = provider;
end;
$$;

-- -- Care bookings --
create type public.care_booking_status as enum ('requested', 'confirmed', 'declined', 'cancelled', 'done');

create table public.care_bookings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.care_providers (id) on delete cascade,
  buyer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  service text not null check (length(trim(service)) between 2 and 80),
  day date not null,
  slot text not null check (slot ~ '^[0-9]{1,2}:[0-9]{2}$'),
  place text not null default 'premises' check (place in ('premises', 'home')),
  note text not null default '' check (length(note) <= 500),
  -- One of the buyer's own dogs (My dogs), and whether the provider may add this visit to its record
  owned_dog_id uuid references public.owned_dogs (id) on delete set null,
  dog_name text not null default '' check (length(dog_name) <= 40),
  share_record boolean not null default false,
  status public.care_booking_status not null default 'requested',
  provider_note text not null default '' check (length(provider_note) <= 300),
  buyer_name text not null default '',
  buyer_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index care_bookings_provider_idx on public.care_bookings (provider_id, day);
create index care_bookings_buyer_idx on public.care_bookings (buyer_id, day);
create trigger care_bookings_updated_at before update on public.care_bookings for each row execute function public.set_updated_at();

-- A new booking: from the signed-in buyer, for a day ahead, a dog of their own (if any), a listing taking
-- bookings, and with the buyer's name and phone for the provider. Then the provider is told.
create function public.prepare_care_booking()
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
  if not pr.taking_bookings then raise exception 'This provider isn''t taking bookings right now'; end if;
  if new.day <= current_date then raise exception 'Choose a day from tomorrow on'; end if;
  if new.day > current_date + 60 then raise exception 'Choose a day in the next two months'; end if;
  if not (extract(dow from new.day)::smallint = any (pr.weekdays)) then raise exception 'The provider doesn''t work on that day'; end if;
  if not (new.slot = any (pr.slots)) then raise exception 'Choose one of the provider''s times'; end if;
  if new.place = 'home' and not pr.home_visits then raise exception 'This provider doesn''t visit homes'; end if;
  if new.owned_dog_id is not null then
    select name into new.dog_name from public.owned_dogs where id = new.owned_dog_id and owner_id = new.buyer_id;
    if new.dog_name is null then raise exception 'Not your dog'; end if;
  else
    -- A dog not in My dogs: just its name, and nothing to add a record to
    new.dog_name := left(trim(coalesce(new.dog_name, '')), 40);
    new.share_record := false;
  end if;
  if (select count(*) from public.care_bookings where buyer_id = new.buyer_id and status = 'requested') >= 10 then
    raise exception 'You have 10 bookings waiting for an answer. Wait for some replies first';
  end if;
  select coalesce(nullif(full_name, ''), 'A buyer'), nullif(phone, '') into new.buyer_name, new.buyer_phone from public.profiles where id = new.buyer_id;
  return new;
end;
$$;
create trigger care_bookings_prepare before insert on public.care_bookings for each row execute function public.prepare_care_booking();

create function public.notify_care_booking()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform public.notify(m.user_id, 'care', 'Booking request: ' || new.service,
    new.buyer_name || U&' \00B7 ' || to_char(new.day, 'Dy DD Mon') || ', ' || new.slot || case when new.place = 'home' then U&' \00B7 at their home' else '' end,
    '/provider', 'care-booking:' || new.id)
  from public.care_provider_members m where m.provider_id = new.provider_id;
  return new;
end;
$$;
create trigger care_bookings_notify after insert on public.care_bookings for each row execute function public.notify_care_booking();

alter table public.care_bookings enable row level security;
revoke all on public.care_bookings from anon, authenticated;
grant select on public.care_bookings to authenticated;
grant insert (provider_id, service, day, slot, place, note, owned_dog_id, dog_name, share_record) on public.care_bookings to authenticated;
create policy "Buyers read their care bookings" on public.care_bookings for select to authenticated using (buyer_id = (select auth.uid()));
create policy "Providers read their bookings" on public.care_bookings for select to authenticated using (public.is_provider_member(provider_id));
create policy "Staff read care bookings" on public.care_bookings for select to authenticated using (public.is_staff('{admin}'));
create policy "Buyers book" on public.care_bookings for insert to authenticated with check (buyer_id = (select auth.uid()));

-- Answering a booking. The buyer can cancel one that's coming up; the provider confirms, declines or
-- marks it done (with a note for the buyer). Each side hears about the other's change.
create function public.set_care_booking_status(booking uuid, to_status public.care_booking_status, answer_note text default '')
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

-- The provider's bookings with what they need: the buyer's phone while the booking is coming up, the dog,
-- and how many lines they've added to its record
create function public.provider_bookings(provider uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_provider_member(provider) then raise exception 'You don''t manage this listing' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(x order by x.day, x.slot) from (
    select b.id, b.service, b.day, b.slot, b.place, b.note, b.dog_name, b.share_record and b.owned_dog_id is not null as can_add_record,
      b.status, b.provider_note, b.buyer_name, case when b.status in ('requested', 'confirmed') then b.buyer_phone end as buyer_phone,
      b.created_at, (select count(*) from public.owned_dog_records r where r.care_booking_id = b.id) as records_added
    from public.care_bookings b where b.provider_id = provider and b.day >= current_date - 90
  ) x), '[]'::jsonb);
end;
$$;

-- -- Adding to a dog's record, with the owner's permission for that booking --
alter table public.owned_dog_records
  add column provider_id uuid references public.care_providers (id) on delete set null,
  add column care_booking_id uuid references public.care_bookings (id) on delete set null;

-- Records are the owner's; a provider's line goes in through provider_add_record only (which says so)
create or replace function public.check_owned_dog_record()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if current_setting('dogeash.provider_record', true) = 'on' and tg_op = 'INSERT' then
    return new;
  end if;
  new.owner_id := auth.uid();
  if not exists (select 1 from public.owned_dogs d where d.id = new.owned_dog_id and d.owner_id = new.owner_id) then
    raise exception 'Not your dog';
  end if;
  -- Who added a line is never the owner's to change
  if tg_op = 'UPDATE' then
    new.provider_id := old.provider_id;
    new.care_booking_id := old.care_booking_id;
  end if;
  if tg_op = 'INSERT' then
    new.provider_id := null;
    new.care_booking_id := null;
    if (select count(*) from public.owned_dog_records where owned_dog_id = new.owned_dog_id) >= 300 then
      raise exception 'This dog''s record is full';
    end if;
  end if;
  return new;
end;
$$;

create function public.provider_add_record(booking uuid, rec_kind public.owned_dog_record_kind, rec_title text, rec_done date, rec_due date, rec_note text default '')
returns void language plpgsql security definer set search_path = ''
as $$
declare
  b public.care_bookings;
  pname text;
begin
  select * into b from public.care_bookings where id = booking;
  if b.id is null or not public.is_provider_member(b.provider_id) then raise exception 'You don''t manage this booking' using errcode = '42501'; end if;
  if not b.share_record or b.owned_dog_id is null then raise exception 'The owner didn''t share this dog''s record' using errcode = '42501'; end if;
  if b.status not in ('confirmed', 'done') then raise exception 'Add to the record once the booking is confirmed' using errcode = 'P0001'; end if;
  if length(trim(coalesce(rec_title, ''))) < 1 then raise exception 'What was it?' using errcode = 'P0001'; end if;
  if rec_done is null and rec_due is null then raise exception 'Give at least one date' using errcode = 'P0001'; end if;
  if (select count(*) from public.owned_dog_records where care_booking_id = b.id) >= 10 then raise exception 'Up to 10 lines per booking' using errcode = 'P0001'; end if;
  if (select count(*) from public.owned_dog_records where owned_dog_id = b.owned_dog_id) >= 300 then raise exception 'This dog''s record is full' using errcode = 'P0001'; end if;
  select name into pname from public.care_providers where id = b.provider_id;

  perform set_config('dogeash.provider_record', 'on', true);
  insert into public.owned_dog_records (owned_dog_id, owner_id, kind, title, done_on, due_on, by_whom, note, provider_id, care_booking_id)
  values (b.owned_dog_id, b.buyer_id, rec_kind, left(trim(rec_title), 80), rec_done, rec_due, left(pname, 80), left(trim(coalesce(rec_note, '')), 500), b.provider_id, b.id);
  perform set_config('dogeash.provider_record', 'off', true);

  perform public.notify(b.buyer_id, 'care', pname || ' added to ' || b.dog_name || '''s record', left(trim(rec_title), 80), '/account/dogs/' || b.owned_dog_id, 'care-record:' || b.id);
end;
$$;

-- What the provider added for a booking (they can't read the rest of the dog's record)
create function public.provider_booking_records(booking uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  b public.care_bookings;
begin
  select * into b from public.care_bookings where id = booking;
  if b.id is null or not public.is_provider_member(b.provider_id) then raise exception 'You don''t manage this booking' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('kind', r.kind, 'title', r.title, 'doneOn', r.done_on, 'dueOn', r.due_on, 'note', r.note) order by r.created_at)
    from public.owned_dog_records r where r.care_booking_id = b.id), '[]'::jsonb);
end;
$$;

-- -- Permissions --
revoke execute on function public.is_provider_member(uuid) from public, anon;
revoke execute on function public.admin_invite_provider(text, text) from public, anon;
revoke execute on function public.admin_provider_managers() from public, anon;
revoke execute on function public.my_provider_invites() from public, anon;
revoke execute on function public.accept_provider_invite(uuid) from public, anon;
revoke execute on function public.provider_save_profile(uuid, jsonb) from public, anon;
revoke execute on function public.set_care_booking_status(uuid, public.care_booking_status, text) from public, anon;
revoke execute on function public.provider_bookings(uuid) from public, anon;
revoke execute on function public.provider_add_record(uuid, public.owned_dog_record_kind, text, date, date, text) from public, anon;
revoke execute on function public.provider_booking_records(uuid) from public, anon;
revoke execute on function public.prepare_care_booking() from public, anon, authenticated;
revoke execute on function public.notify_care_booking() from public, anon, authenticated;
grant execute on function public.is_provider_member(uuid) to authenticated;
grant execute on function public.admin_invite_provider(text, text) to authenticated;
grant execute on function public.admin_provider_managers() to authenticated;
grant execute on function public.my_provider_invites() to authenticated;
grant execute on function public.accept_provider_invite(uuid) to authenticated;
grant execute on function public.provider_save_profile(uuid, jsonb) to authenticated;
grant execute on function public.set_care_booking_status(uuid, public.care_booking_status, text) to authenticated;
grant execute on function public.provider_bookings(uuid) to authenticated;
grant execute on function public.provider_add_record(uuid, public.owned_dog_record_kind, text, date, date, text) to authenticated;
grant execute on function public.provider_booking_records(uuid) to authenticated;
