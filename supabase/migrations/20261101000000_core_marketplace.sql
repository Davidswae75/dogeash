-- Core marketplace: profiles, stores, store members, dogs and shortlists.
-- Row level security is on for every table: it is what actually protects the data, because
-- the browser talks to the database directly. Grants are explicit, column by column where
-- it matters, so a store can never verify itself or a member promote themselves.

-- ── Types ───────────────────────────────────────────────────────────────────
create type public.store_status as enum ('draft', 'in_review', 'verified', 'suspended');
create type public.store_role as enum ('owner', 'manager', 'handler');
create type public.dog_status as enum ('draft', 'pending_review', 'available', 'reserved', 'sold', 'withdrawn');
create type public.dog_sex as enum ('Male', 'Female');
create type public.property_type as enum ('home', 'compound', 'estate', 'business');

-- ── Tables ──────────────────────────────────────────────────────────────────
-- One per person; created automatically when they sign up
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,                 -- e.g. STR-001, shown on the store's file line
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) >= 2),
  initials text not null default '',
  tagline text not null default '',
  city text not null,
  area text not null default '',
  state text not null default '',
  founded int,
  status public.store_status not null default 'draft',
  rating numeric(2, 1) not null default 0,
  reviews_count int not null default 0,
  details jsonb not null default '{}',            -- about, owner, history, inspection, services, care
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_members (
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.store_role not null,
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);
create index store_members_user_idx on public.store_members (user_id);

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  file_no text not null unique,                   -- the public K9 file number, e.g. KD-2026-003
  store_id uuid not null references public.stores (id) on delete restrict,
  name text not null,
  breed text not null,
  sex public.dog_sex not null,
  city text not null,
  age text not null,
  weight_kg numeric(5, 1) not null check (weight_kg > 0),
  hips text not null default 'Not tested',
  level smallint not null check (level between 1 and 5),
  price_naira bigint not null check (price_naira >= 0),
  status public.dog_status not null default 'draft',
  photo_path text,
  property public.property_type[] not null default '{}',
  safe_with_children boolean not null default false,
  file jsonb,                                     -- the full K9 file shown on the dog's page
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dogs_store_idx on public.dogs (store_id);
create index dogs_browse_idx on public.dogs (status, level, city);

create table public.shortlist_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  dog_id uuid not null references public.dogs (id) on delete cascade,
  comparing boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, dog_id)
);

-- ── Helpers ─────────────────────────────────────────────────────────────────
-- Is the signed-in person a member of this store, in one of these roles?
-- Security definer so policies on store_members can use it without recursing.
create function public.has_store_role(target_store uuid, roles public.store_role[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.store_members m
    where m.store_id = target_store and m.user_id = (select auth.uid()) and m.role = any (roles)
  );
$$;

create function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger stores_updated_at before update on public.stores for each row execute function public.set_updated_at();
create trigger dogs_updated_at before update on public.dogs for each row execute function public.set_updated_at();

-- A new account gets a profile. Only the name is copied: sign-up metadata is user-supplied.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Whoever creates a store becomes its owner
create function public.handle_new_store()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null then
    insert into public.store_members (store_id, user_id, role) values (new.id, auth.uid(), 'owner');
  end if;
  return new;
end;
$$;
create trigger on_store_created after insert on public.stores for each row execute function public.handle_new_store();

-- A store can't be left without an owner: removing or demoting the last one is refused.
-- Deleting the store itself cascades through here, so a store that's going away is let through.
create function public.keep_one_owner()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'owner'
    and (tg_op = 'DELETE' or new.role <> 'owner')
    and exists (select 1 from public.stores s where s.id = old.store_id)
    and not exists (
      select 1 from public.store_members m
      where m.store_id = old.store_id and m.role = 'owner' and m.user_id <> old.user_id
    )
  then
    raise exception 'A store needs at least one owner';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger store_members_keep_owner before update or delete on public.store_members
  for each row execute function public.keep_one_owner();

-- Helpers are for policies and triggers, not for calling over the API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_store() from public, anon, authenticated;
revoke execute on function public.keep_one_owner() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.has_store_role(uuid, public.store_role[]) from public, anon;
grant execute on function public.has_store_role(uuid, public.store_role[]) to authenticated;

-- ── Access rules ────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.dogs enable row level security;
alter table public.shortlist_items enable row level security;

revoke all on public.profiles, public.stores, public.store_members, public.dogs, public.shortlist_items from anon, authenticated;

-- Profiles: yours only
grant select on public.profiles to authenticated;
grant update (full_name, phone, city) on public.profiles to authenticated;
create policy "Read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Stores: everyone sees verified ones; members also see their own. `status`, `rating` and
-- `reviews_count` aren't grantable: only Dogeash staff (with the secret key) change them.
grant select on public.stores to anon, authenticated;
grant insert (public_id, slug, name, initials, tagline, city, area, state, founded, details) on public.stores to authenticated;
grant update (name, initials, tagline, city, area, state, founded, details) on public.stores to authenticated;
grant delete on public.stores to authenticated;
create policy "Read verified stores" on public.stores for select to anon, authenticated using (status = 'verified');
-- created_by covers the moment before the owner's membership exists, so an insert can read itself back
create policy "Members read their store" on public.stores for select to authenticated using (created_by = (select auth.uid()) or public.has_store_role(id, '{owner,manager,handler}'));
create policy "Anyone signed in can start a store" on public.stores for insert to authenticated with check (true);
create policy "Owners and managers edit their store" on public.stores for update to authenticated using (public.has_store_role(id, '{owner,manager}')) with check (public.has_store_role(id, '{owner,manager}'));
create policy "Owners delete a store still in draft" on public.stores for delete to authenticated using (status = 'draft' and public.has_store_role(id, '{owner}'));

-- Store members: colleagues see each other; only owners change the team
grant select, delete on public.store_members to authenticated;
grant insert (store_id, user_id, role) on public.store_members to authenticated;
grant update (role) on public.store_members to authenticated;
create policy "Members see their team" on public.store_members for select to authenticated using (user_id = (select auth.uid()) or public.has_store_role(store_id, '{owner,manager,handler}'));
create policy "Owners add members" on public.store_members for insert to authenticated with check (public.has_store_role(store_id, '{owner}'));
create policy "Owners change roles" on public.store_members for update to authenticated using (public.has_store_role(store_id, '{owner}')) with check (public.has_store_role(store_id, '{owner}'));
create policy "Owners remove members, anyone can leave" on public.store_members for delete to authenticated using (user_id = (select auth.uid()) or public.has_store_role(store_id, '{owner}'));

-- Dogs: the public sees listed dogs of verified stores; a store's people see and manage all of theirs.
-- Listing a dog needs a verified store, so nothing goes public before the inspection passes.
grant select on public.dogs to anon, authenticated;
grant insert (file_no, store_id, name, breed, sex, city, age, weight_kg, hips, level, price_naira, status, photo_path, property, safe_with_children, file) on public.dogs to authenticated;
grant update (name, breed, sex, city, age, weight_kg, hips, level, price_naira, status, photo_path, property, safe_with_children, file) on public.dogs to authenticated;
grant delete on public.dogs to authenticated;
create policy "Read listed dogs" on public.dogs for select to anon, authenticated using (
  status in ('available', 'reserved')
  and exists (select 1 from public.stores s where s.id = store_id and s.status = 'verified')
);
create policy "Members read their dogs" on public.dogs for select to authenticated using (public.has_store_role(store_id, '{owner,manager,handler}'));
create policy "Members add dogs" on public.dogs for insert to authenticated with check (public.has_store_role(store_id, '{owner,manager,handler}') and status in ('draft', 'pending_review'));
create policy "Members edit dogs" on public.dogs for update to authenticated using (public.has_store_role(store_id, '{owner,manager,handler}')) with check (
  public.has_store_role(store_id, '{owner,manager,handler}')
  and (
    status in ('draft', 'pending_review', 'withdrawn')
    or exists (select 1 from public.stores s where s.id = store_id and s.status = 'verified')
  )
);
create policy "Owners and managers delete drafts" on public.dogs for delete to authenticated using (status = 'draft' and public.has_store_role(store_id, '{owner,manager}'));

-- Shortlists: yours only
grant select, insert, update, delete on public.shortlist_items to authenticated;
create policy "Manage own shortlist" on public.shortlist_items for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
