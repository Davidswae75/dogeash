-- Care listings: Dogeash adds a provider's business, invites the people who'll manage it, and lists it when
-- it's ready. A hidden listing is seen only by Dogeash and its managers; buyers see listed ones.
-- Existing providers stay listed. Plain ASCII.

alter table public.care_providers add column listed boolean not null default true;

drop policy "Anyone reads care providers" on public.care_providers;
create policy "Anyone reads listed providers" on public.care_providers for select to anon, authenticated using (listed);
create policy "Managers read their listing" on public.care_providers for select to authenticated using (public.is_provider_member(id));
create policy "Staff read every provider" on public.care_providers for select to authenticated using (public.is_staff('{admin}'));

-- Saving a provider from the admin: as before, plus whether it's listed (new providers are listed unless
-- the admin says otherwise; an edit leaves it as it was unless given)
create or replace function public.admin_save_provider(p jsonb)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  pid text := nullif(trim(coalesce(p ->> 'id', '')), '');
  nm text := trim(coalesce(p ->> 'name', ''));
  sl text := trim(both '-' from regexp_replace(replace(lower(trim(coalesce(p ->> 'name', ''))), '&', 'and'), '[^a-z0-9]+', '-', 'g'));
  existed boolean;
begin
  perform public.require_staff('{admin}');
  if length(nm) < 2 then raise exception 'Give the provider a name'; end if;
  existed := pid is not null;
  if not existed then
    pid := 'CARE-' || lpad((coalesce((select max(substring(public_id from 6)::int) from public.care_providers where public_id ~ '^CARE-[0-9]+$'), 0) + 1)::text, 2, '0');
    insert into public.care_providers (public_id, slug, name, person, type, city, areas, home_visits, verified, credential, price_from, listed)
    values (pid, sl, nm, nullif(trim(coalesce(p ->> 'person', '')), ''), (p ->> 'type')::public.care_type, trim(coalesce(p ->> 'city', '')),
      trim(coalesce(p ->> 'areas', '')), coalesce((p ->> 'homeVisits')::boolean, false), coalesce((p ->> 'verified')::boolean, false),
      trim(coalesce(p ->> 'credential', '')), coalesce((p ->> 'priceFrom')::bigint, 0), coalesce((p ->> 'listed')::boolean, true));
  else
    update public.care_providers set slug = sl, name = nm, person = nullif(trim(coalesce(p ->> 'person', '')), ''),
      type = (p ->> 'type')::public.care_type, city = trim(coalesce(p ->> 'city', '')), areas = trim(coalesce(p ->> 'areas', '')),
      home_visits = coalesce((p ->> 'homeVisits')::boolean, false), verified = coalesce((p ->> 'verified')::boolean, false),
      credential = trim(coalesce(p ->> 'credential', '')), price_from = coalesce((p ->> 'priceFrom')::bigint, 0),
      listed = coalesce((p ->> 'listed')::boolean, listed)
    where public_id = pid;
    if not found then raise exception 'No provider %', pid; end if;
  end if;
  perform public.admin_log(case when existed then 'care.edit' else 'care.add' end, 'provider', pid, p - 'id');
  return pid;
end;
$$;
