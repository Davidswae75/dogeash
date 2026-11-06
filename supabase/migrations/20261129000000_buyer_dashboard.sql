-- The buyer's dashboard, for real:
--   1. My dogs: dogs a person owns (bought on Dogeash or not), each with a record of vaccinations,
--      treatments, vet visits, training and reminders. Only the owner sees or changes them.
--   2. Their photos: a private bucket, one folder per owner, opened through short-lived signed links.
--   3. Shortlist price drops: the price a dog had when it was saved, so the overview can say "₦400,000 less".

-- ── 1. Owned dogs and their records ─────────────────────────────────────────
create type public.owned_dog_record_kind as enum ('vaccination', 'treatment', 'vet', 'training', 'reminder');

create table public.owned_dogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 40),
  breed text not null default '' check (length(breed) <= 60),
  sex text check (sex in ('Male', 'Female')),
  born_on date check (born_on is null or born_on <= current_date),
  weight_kg numeric(4, 1) check (weight_kg is null or weight_kg between 1 and 120),
  microchip text not null default '' check (length(microchip) <= 30),
  level smallint check (level is null or level between 1 and 5),
  photo_path text,
  -- Where it came from: a Dogeash store (and the listing) or somewhere else, and when it came home
  store_id uuid references public.stores (id) on delete set null,
  dog_id uuid references public.dogs (id) on delete set null,
  came_from text not null default '' check (length(came_from) <= 80),
  got_on date check (got_on is null or got_on <= current_date),
  notes text not null default '' check (length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index owned_dogs_owner_idx on public.owned_dogs (owner_id, created_at);
create trigger owned_dogs_updated_at before update on public.owned_dogs for each row execute function public.set_updated_at();

-- One line in a dog's record. `done_on`: when it was given or happened; `due_on`: when it's next due
-- (a vaccination booster, a reminder). At least one of the two.
create table public.owned_dog_records (
  id uuid primary key default gen_random_uuid(),
  owned_dog_id uuid not null references public.owned_dogs (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.owned_dog_record_kind not null,
  title text not null check (length(trim(title)) between 1 and 80),
  done_on date,
  due_on date,
  by_whom text not null default '' check (length(by_whom) <= 80),
  note text not null default '' check (length(note) <= 500),
  created_at timestamptz not null default now(),
  check (done_on is not null or due_on is not null)
);
create index owned_dog_records_dog_idx on public.owned_dog_records (owned_dog_id, coalesce(due_on, done_on));

-- Owners only, and never someone else's dog: the owner is always the signed-in person, a record always
-- belongs to one of their dogs, and there's a sensible cap (20 dogs, 300 lines per dog).
create function public.check_owned_dog()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.owner_id := auth.uid();
  if new.owner_id is null then raise exception 'Sign in first'; end if;
  if tg_op = 'INSERT' and (select count(*) from public.owned_dogs where owner_id = new.owner_id) >= 20 then
    raise exception 'You can keep up to 20 dogs here';
  end if;
  if new.photo_path is not null and split_part(new.photo_path, '/', 1) <> new.owner_id::text then
    raise exception 'That photo isn''t yours';
  end if;
  return new;
end;
$$;
create trigger owned_dogs_check before insert or update on public.owned_dogs for each row execute function public.check_owned_dog();

create function public.check_owned_dog_record()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.owner_id := auth.uid();
  if not exists (select 1 from public.owned_dogs d where d.id = new.owned_dog_id and d.owner_id = new.owner_id) then
    raise exception 'Not your dog';
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.owned_dog_records where owned_dog_id = new.owned_dog_id) >= 300 then
    raise exception 'This dog''s record is full';
  end if;
  return new;
end;
$$;
create trigger owned_dog_records_check before insert or update on public.owned_dog_records for each row execute function public.check_owned_dog_record();
revoke execute on function public.check_owned_dog() from public, anon, authenticated;
revoke execute on function public.check_owned_dog_record() from public, anon, authenticated;

alter table public.owned_dogs enable row level security;
alter table public.owned_dog_records enable row level security;
revoke all on public.owned_dogs, public.owned_dog_records from anon, authenticated;
grant select, delete on public.owned_dogs, public.owned_dog_records to authenticated;
grant insert (name, breed, sex, born_on, weight_kg, microchip, level, photo_path, store_id, came_from, got_on, notes) on public.owned_dogs to authenticated;
grant update (name, breed, sex, born_on, weight_kg, microchip, level, photo_path, store_id, came_from, got_on, notes) on public.owned_dogs to authenticated;
grant insert (owned_dog_id, kind, title, done_on, due_on, by_whom, note) on public.owned_dog_records to authenticated;
grant update (kind, title, done_on, due_on, by_whom, note) on public.owned_dog_records to authenticated;

create policy "Owners manage their dogs" on public.owned_dogs for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners manage their dogs' records" on public.owned_dog_records for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- ── 2. Their photos: private, one folder per owner (<user id>/<file>) ───────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('owned-dog-photos', 'owned-dog-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Owners add their dogs' photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'owned-dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners replace their dogs' photos" on storage.objects for update to authenticated
  using (bucket_id = 'owned-dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'owned-dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners remove their dogs' photos" on storage.objects for delete to authenticated
  using (bucket_id = 'owned-dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners see their dogs' photos" on storage.objects for select to authenticated
  using (bucket_id = 'owned-dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ── 3. The price a shortlisted dog had when it was saved ────────────────────
alter table public.shortlist_items add column saved_price bigint;
update public.shortlist_items s set saved_price = d.price_naira from public.dogs d where d.id = s.dog_id and s.saved_price is null;

create function public.set_shortlist_saved_price()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  select price_naira into new.saved_price from public.dogs where id = new.dog_id;
  return new;
end;
$$;
create trigger shortlist_items_saved_price before insert on public.shortlist_items for each row execute function public.set_shortlist_saved_price();
revoke execute on function public.set_shortlist_saved_price() from public, anon, authenticated;
