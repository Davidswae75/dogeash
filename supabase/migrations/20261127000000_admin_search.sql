-- Search across the admin console: stores (name, id, city), dogs (name, file number, breed), people (name, email,
-- phone) and care providers (name, person, city), up to 8 of each, best matches first. Admins only.

create function public.admin_search(q text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  term text := lower(trim(coalesce(q, '')));
  pat text := '%' || replace(replace(lower(trim(coalesce(q, ''))), '%', ''), '_', '') || '%';
begin
  perform public.require_staff('{admin}');
  if length(term) < 2 then return jsonb_build_object('stores', '[]'::jsonb, 'dogs', '[]'::jsonb, 'people', '[]'::jsonb, 'care', '[]'::jsonb); end if;
  return jsonb_build_object(
    'stores', (select coalesce(jsonb_agg(x), '[]') from (
      select s.public_id as id, s.name as title, s.public_id || ' · ' || s.city || ' · ' || s.status as detail
      from public.stores s where lower(s.name) like pat or lower(s.public_id) like pat or lower(s.city) like pat
      order by (lower(s.name) like term || '%') desc, s.name limit 8) x),
    'dogs', (select coalesce(jsonb_agg(x), '[]') from (
      select d.file_no as id, d.name as title, d.file_no || ' · ' || d.breed || ' · ' || s.name || ' · ' || d.status as detail, s.public_id as store_id
      from public.dogs d join public.stores s on s.id = d.store_id
      where lower(d.name) like pat or lower(d.file_no) like pat or lower(d.breed) like pat
      order by (lower(d.file_no) = term) desc, (lower(d.name) like term || '%') desc, d.name limit 8) x),
    'people', (select coalesce(jsonb_agg(x), '[]') from (
      select u.id::text as id, coalesce(nullif(p.full_name, ''), u.email) as title, concat_ws(' · ', u.email, p.phone, p.city) as detail
      from auth.users u left join public.profiles p on p.id = u.id
      where lower(coalesce(p.full_name, '')) like pat or lower(coalesce(u.email, '')) like pat or lower(coalesce(p.phone, '')) like pat
      order by (lower(coalesce(p.full_name, '')) like term || '%') desc, u.created_at desc limit 8) x),
    'care', (select coalesce(jsonb_agg(x), '[]') from (
      select c.public_id as id, c.name as title, concat_ws(' · ', c.public_id, c.person, c.city) as detail
      from public.care_providers c where lower(c.name) like pat or lower(coalesce(c.person, '')) like pat or lower(c.city) like pat or lower(c.public_id) like pat
      order by c.name limit 8) x)
  );
end;
$$;

revoke execute on function public.admin_search(text) from public, anon;
grant execute on function public.admin_search(text) to authenticated;
