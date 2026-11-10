-- A provider's team, 10 Nov: the people who work there (name, role, photo), shown on the provider's page as
-- "Our team". Up to 12. Photos are the provider's own uploads in the care-media bucket.
-- Runs after 20261212000000_dog_care_team.sql.

alter table public.care_providers
  add column team jsonb not null default '[]' check (jsonb_typeof(team) = 'array' and jsonb_array_length(team) <= 12);

create function public.provider_save_team(provider uuid, members jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  folder text := provider::text || '/';
begin
  if not public.is_provider_member(provider) then raise exception 'You don''t manage this listing' using errcode = '42501'; end if;
  if jsonb_typeof(coalesce(members, '[]')) <> 'array' then raise exception 'A list of people'; end if;
  if jsonb_array_length(coalesce(members, '[]')) > 12 then raise exception 'Up to 12 people'; end if;
  if exists (select 1 from jsonb_array_elements(coalesce(members, '[]')) m
      where nullif(m ->> 'photo', '') is not null and m ->> 'photo' not like folder || '%') then
    raise exception 'Photos must be your own uploads';
  end if;
  update public.care_providers set team = coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', left(trim(m ->> 'name'), 80),
      'role', left(trim(coalesce(m ->> 'role', '')), 80),
      'photo', nullif(m ->> 'photo', '')
    ) order by ord)
    from jsonb_array_elements(coalesce(members, '[]')) with ordinality as t(m, ord)
    where length(trim(coalesce(m ->> 'name', ''))) > 0
  ), '[]')
  where id = provider;
end;
$$;
revoke execute on function public.provider_save_team(uuid, jsonb) from public, anon;
grant execute on function public.provider_save_team(uuid, jsonb) to authenticated;
