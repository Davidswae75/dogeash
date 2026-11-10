-- A dog's care team, 10 Nov: the owner picks Dogeash care providers for one of their dogs (its vet, trainer,
-- groomer...). Booking care from the dog's page then offers those first, already set to that dog, with the
-- owner's standing choice about letting them add visits to its record (share_record). Up to 8 per dog.
-- Only the owner sees or changes it. Runs after 20261211000000_care_three_weeks_waitlist.sql.

create table public.owned_dog_providers (
  owned_dog_id uuid not null references public.owned_dogs (id) on delete cascade,
  provider_id uuid not null references public.care_providers (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  share_record boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (owned_dog_id, provider_id)
);
create index owned_dog_providers_owner_idx on public.owned_dog_providers (owner_id);

-- Always the dog's owner; a listed provider only; up to 8 per dog
create function public.check_dog_provider()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.owner_id := auth.uid();
  if not exists (select 1 from public.owned_dogs where id = new.owned_dog_id and owner_id = new.owner_id) then
    raise exception 'Not your dog' using errcode = '42501';
  end if;
  if not exists (select 1 from public.care_providers where id = new.provider_id and listed) then
    raise exception 'This provider isn''t on Dogeash right now';
  end if;
  if public.is_provider_member(new.provider_id) then raise exception 'You manage this listing, so you can''t add it'; end if;
  if (select count(*) from public.owned_dog_providers where owned_dog_id = new.owned_dog_id) >= 8 then
    raise exception 'A dog can have up to 8 care providers';
  end if;
  return new;
end;
$$;
create trigger owned_dog_providers_check before insert on public.owned_dog_providers for each row execute function public.check_dog_provider();
revoke execute on function public.check_dog_provider() from public, anon, authenticated;

alter table public.owned_dog_providers enable row level security;
revoke all on public.owned_dog_providers from anon, authenticated;
grant select, delete on public.owned_dog_providers to authenticated;
grant insert (owned_dog_id, provider_id, share_record) on public.owned_dog_providers to authenticated;
grant update (share_record) on public.owned_dog_providers to authenticated;
create policy "Owners read their dogs' care teams" on public.owned_dog_providers for select to authenticated using (owner_id = (select auth.uid()));
create policy "Owners add to their dogs' care teams" on public.owned_dog_providers for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Owners change their dogs' care teams" on public.owned_dog_providers for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners remove from their dogs' care teams" on public.owned_dog_providers for delete to authenticated using (owner_id = (select auth.uid()));
