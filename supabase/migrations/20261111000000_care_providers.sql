-- The care network in the database. Care providers (vets, trainers, groomers, kennel builders, equipment
-- suppliers, boarding) exist once and are listed by Dogeash; anyone can read them. A store links the
-- providers it works with and says what each does for it ("Our vet"); its owners and managers manage
-- those links, up to 12. Each store's care team moves here from `details` (the old `care` list).
-- The nine sample providers are added here so the live directory matches what the site showed.

create type public.care_type as enum ('vet', 'trainer', 'groomer', 'builder', 'equipment', 'boarding');

create table public.care_providers (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,                 -- e.g. CARE-01
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 2 and 80),
  person text,
  type public.care_type not null,
  city text not null,
  areas text not null default '',
  home_visits boolean not null default false,
  verified boolean not null default false,
  credential text not null default '',
  rating numeric(2, 1) not null default 0,
  reviews_count int not null default 0,
  price_from bigint not null default 0 check (price_from >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger care_providers_updated_at before update on public.care_providers for each row execute function public.set_updated_at();

create table public.store_care_links (
  store_id uuid not null references public.stores (id) on delete cascade,
  provider_id uuid not null references public.care_providers (id) on delete cascade,
  relationship text not null check (length(trim(relationship)) between 1 and 60),
  created_at timestamptz not null default now(),
  primary key (store_id, provider_id)
);
create index store_care_links_provider_idx on public.store_care_links (provider_id);

-- Up to 12 providers per store
create function public.limit_care_links()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.store_care_links where store_id = new.store_id) >= 12 then
    raise exception 'A store can link up to 12 care providers';
  end if;
  return new;
end;
$$;
create trigger store_care_links_limit before insert on public.store_care_links for each row execute function public.limit_care_links();

-- ── Access ──────────────────────────────────────────────────────────────────
alter table public.care_providers enable row level security;
alter table public.store_care_links enable row level security;

create policy "Anyone reads care providers" on public.care_providers for select to anon, authenticated using (true);

create policy "Anyone reads the care teams of verified stores" on public.store_care_links for select to anon, authenticated
  using (exists (select 1 from public.stores s where s.id = store_id and s.status = 'verified'));
create policy "A store's people read its care team" on public.store_care_links for select to authenticated
  using (public.has_store_role(store_id, '{owner,manager,handler}'));
create policy "Owners and managers link providers" on public.store_care_links for insert to authenticated
  with check (public.has_store_role(store_id, '{owner,manager}'));
create policy "Owners and managers edit links" on public.store_care_links for update to authenticated
  using (public.has_store_role(store_id, '{owner,manager}')) with check (public.has_store_role(store_id, '{owner,manager}'));
create policy "Owners and managers remove links" on public.store_care_links for delete to authenticated
  using (public.has_store_role(store_id, '{owner,manager}'));

revoke all on public.care_providers, public.store_care_links from anon, authenticated;
grant select on public.care_providers to anon, authenticated;
grant select on public.store_care_links to anon, authenticated;
grant insert (store_id, provider_id, relationship) on public.store_care_links to authenticated;
grant update (relationship) on public.store_care_links to authenticated;
grant delete on public.store_care_links to authenticated;
revoke execute on function public.limit_care_links() from public, anon, authenticated;

-- ── The sample directory, and each store's care team out of `details` ───────
insert into public.care_providers (public_id, slug, name, person, type, city, areas, home_visits, verified, credential, rating, reviews_count, price_from) values
('CARE-01', 'kuje-veterinary-clinic', 'Kuje Veterinary Clinic', 'Dr. Halima Sani', 'vet', 'Abuja', 'Abuja and environs', true, true, 'VCN registered veterinary surgeon', 4.9, 132, 15000),
('CARE-02', 'steelpaw-training', 'Steelpaw Training', 'Sgt. (rtd) Emeka Obi', 'trainer', 'Abuja', 'Nationwide, travels to you', true, true, 'Former Police K9 handler', 4.8, 74, 45000),
('CARE-03', 'fortress-kennels-and-runs', 'Fortress Kennels & Runs', null, 'builder', 'Abuja', 'Abuja, Ibadan, Lagos', true, true, 'Registered business, Dogeash checked', 4.6, 31, 350000),
('CARE-04', 'lekki-pet-and-livestock-hospital', 'Lekki Pet & Livestock Hospital', 'Dr. Tobi Adeyemi', 'vet', 'Lagos', 'Lekki, Ajah, Victoria Island', false, true, 'VCN registered veterinary surgeon', 4.7, 210, 20000),
('CARE-05', 'cleancoat-mobile-grooming', 'CleanCoat Mobile Grooming', null, 'groomer', 'Lagos', 'Lagos Island and Lekki', true, false, 'Listed, not yet checked', 4.5, 18, 12000),
('CARE-06', 'k9-gear-nigeria', 'K9 Gear Nigeria', null, 'equipment', 'Lagos', 'Ships nationwide', false, true, 'Registered business, Dogeash checked', 4.6, 57, 8000),
('CARE-07', 'garden-city-vets', 'Garden City Vets', 'Dr. Ibiere George', 'vet', 'Port Harcourt', 'Port Harcourt and Obio-Akpor', true, true, 'VCN registered veterinary surgeon', 4.8, 96, 18000),
('CARE-08', 'bodija-animal-clinic', 'Bodija Animal Clinic', 'Dr. Folake Ojo', 'vet', 'Ibadan', 'Ibadan', true, true, 'VCN registered veterinary surgeon', 4.7, 88, 12000),
('CARE-09', 'sahel-veterinary-services', 'Sahel Veterinary Services', 'Dr. Aminu Bello', 'vet', 'Kano', 'Kano and Kaduna', true, true, 'VCN registered veterinary surgeon', 4.6, 44, 10000)
on conflict (public_id) do nothing;

insert into public.store_care_links (store_id, provider_id, relationship)
select s.id, p.id, left(coalesce(nullif(trim(c ->> 'relationship'), ''), 'Works with us'), 60)
from public.stores s
cross join lateral jsonb_array_elements(case when jsonb_typeof(s.details -> 'care') = 'array' then s.details -> 'care' else '[]'::jsonb end) c
join public.care_providers p on p.public_id = c ->> 'providerId'
on conflict (store_id, provider_id) do nothing;

update public.stores set details = details - 'care' where details ? 'care';
