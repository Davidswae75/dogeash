-- Applications: also list stores in review that have no application form (stores added before applications
-- existed, like the sample Eastgate K9 Academy). The sidebar's "waiting" count already includes them, so the
-- page and the count now agree. `has_form` says whether the store filled the application in.

create or replace function public.admin_applications()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return (select coalesce(jsonb_agg(x order by x.submitted_at desc nulls last), '[]') from (
    select s.public_id, s.name, s.city, s.area, s.state, s.status, s.status_note, s.tagline,
      s.details ->> 'about' as about, s.details -> 'owner' as owner_profile, s.created_at,
      (a.store_id is not null) as has_form,
      coalesce(a.address, '') as address, coalesce(a.directions, '') as directions, coalesce(a.contact_phone, '') as contact_phone,
      coalesce(a.preferred_days, '{}') as preferred_days, coalesce(a.cac_registered, true) as cac_registered, coalesce(a.note, '') as note,
      a.id_doc_path, a.cac_doc_path, a.address_doc_path, a.submitted_at, coalesce(a.updated_at, s.updated_at) as updated_at,
      (select jsonb_build_object('name', coalesce(nullif(p.full_name, ''), u.email), 'email', u.email, 'phone', p.phone)
         from public.store_members m join auth.users u on u.id = m.user_id left join public.profiles p on p.id = m.user_id
         where m.store_id = s.id and m.role = 'owner' order by m.created_at limit 1) as owner,
      (select count(*) from public.dogs d where d.store_id = s.id) as dogs
    from public.stores s left join public.store_applications a on a.store_id = s.id
    where s.status = 'in_review' or (s.status = 'draft' and a.submitted_at is not null)
  ) x);
end;
$$;
