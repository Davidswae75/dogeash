-- Detail pages in the admin console: everything about one store, and everything about one person, in one call
-- each (admins with a one-time code only). Private message text is never included: only counts and dates.

-- A store: the store itself, its team (with emails), dogs, recent reviews, visits, application, inspections,
-- care team, open reports, and the audit log for it and its dogs
create function public.admin_store(target text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  st record;
begin
  perform public.require_staff('{admin}');
  select * into st from public.stores where public_id = target;
  if st is null then raise exception 'No store %', target; end if;
  return jsonb_build_object(
    'store', jsonb_build_object('id', st.id, 'public_id', st.public_id, 'slug', st.slug, 'name', st.name, 'tagline', st.tagline,
      'city', st.city, 'area', st.area, 'state', st.state, 'founded', st.founded, 'status', st.status, 'status_note', st.status_note,
      'status_changed_at', st.status_changed_at, 'rating', st.rating, 'reviews_count', st.reviews_count, 'created_at', st.created_at,
      'about', st.details ->> 'about', 'owner_profile', st.details -> 'owner', 'inspection', st.details -> 'inspection',
      'visits_paused', st.visits_paused, 'pause_note', st.pause_note, 'logo_path', st.logo_path),
    'team', (select coalesce(jsonb_agg(jsonb_build_object('id', m.user_id, 'name', coalesce(nullif(p.full_name, ''), u.email), 'email', u.email,
        'phone', p.phone, 'role', m.role, 'since', m.created_at, 'blocked', exists (select 1 from public.blocked_accounts b where b.user_id = m.user_id)) order by m.role, m.created_at), '[]')
      from public.store_members m join auth.users u on u.id = m.user_id left join public.profiles p on p.id = m.user_id where m.store_id = st.id),
    'dogs', (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'file_no', d.file_no, 'name', d.name, 'breed', d.breed, 'status', d.status,
        'level', d.level, 'price_naira', d.price_naira, 'photo_path', d.photo_path, 'updated_at', d.updated_at) order by d.updated_at desc), '[]')
      from public.dogs d where d.store_id = st.id),
    'reviews', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
        select r.id, r.rating, r.body, r.author_name, r.store_reply, r.created_at from public.store_reviews r where r.store_id = st.id order by r.created_at desc limit 20) x),
    'visits', jsonb_build_object(
      'by_status', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from public.visits where store_id = st.id group by status) v),
      'recent', (select coalesce(jsonb_agg(x order by x.day desc), '[]') from (
        select v.id, v.day, v.slot, v.status, v.buyer_name, v.created_at from public.visits v where v.store_id = st.id order by v.day desc limit 10) x)),
    'conversations', (select count(*) from public.conversations where store_id = st.id),
    'application', (select to_jsonb(a) - 'store_id' from public.store_applications a where a.store_id = st.id),
    'inspections', (select coalesce(jsonb_agg(x order by x.scheduled_for desc), '[]') from (
        select i.id, i.status, i.scheduled_for, i.completed_at, coalesce(nullif(p.full_name, ''), u.email) as inspector
        from public.inspections i left join auth.users u on u.id = i.inspector_id left join public.profiles p on p.id = i.inspector_id where i.store_id = st.id) x),
    'care', (select count(*) from public.store_care_links where store_id = st.id),
    'open_reports', (select count(*) from public.reports r where r.status = 'open'
      and ((r.kind = 'store' and r.target_id = st.public_id) or (r.kind = 'dog' and r.target_id in (select file_no from public.dogs where store_id = st.id)))),
    'audit', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
        select a.id, a.actor_name, a.action, a.target_type, a.target_id, a.detail, a.created_at from public.admin_audit a
        where (a.target_type = 'store' and a.target_id = st.public_id) or (a.target_type = 'dog' and a.target_id in (select file_no from public.dogs where store_id = st.id))
        order by a.created_at desc limit 50) x)
  );
end;
$$;

-- A person: their account, staff role, block, stores, and what they've done on Dogeash (visits, conversations
-- with dates and counts but no message text, reviews, reports made), plus admin actions about them
create function public.admin_person(target uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  u record;
begin
  perform public.require_staff('{admin}');
  select au.id, au.email, au.created_at, au.last_sign_in_at, p.full_name, p.phone, p.city, p.property, p.experience,
    p.notify_email, p.notify_sms, p.notify_whatsapp
    into u from auth.users au left join public.profiles p on p.id = au.id where au.id = target;
  if u is null then raise exception 'No such account'; end if;
  return jsonb_build_object(
    'person', jsonb_build_object('id', u.id, 'name', coalesce(u.full_name, ''), 'email', u.email, 'phone', u.phone, 'city', u.city,
      'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at, 'property', u.property, 'experience', u.experience,
      'notify', jsonb_build_object('email', u.notify_email, 'sms', u.notify_sms, 'whatsapp', u.notify_whatsapp)),
    'staff_role', (select role from public.staff where user_id = target),
    'blocked', (select to_jsonb(b) - 'user_id' from public.blocked_accounts b where b.user_id = target),
    'stores', (select coalesce(jsonb_agg(jsonb_build_object('id', s.public_id, 'name', s.name, 'status', s.status, 'role', m.role, 'since', m.created_at)), '[]')
      from public.store_members m join public.stores s on s.id = m.store_id where m.user_id = target),
    'visits', (select coalesce(jsonb_agg(x order by x.day desc), '[]') from (
        select v.day, v.slot, v.status, s.name as store, s.public_id as store_id from public.visits v join public.stores s on s.id = v.store_id
        where v.buyer_id = target order by v.day desc limit 20) x),
    'conversations', (select coalesce(jsonb_agg(x order by x.last_message_at desc), '[]') from (
        select s.name as store, s.public_id as store_id, c.last_message_at,
          (select count(*) from public.messages m where m.conversation_id = c.id) as messages
        from public.conversations c join public.stores s on s.id = c.store_id where c.buyer_id = target order by c.last_message_at desc limit 20) x),
    'reviews', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
        select r.id, r.rating, r.body, s.name as store, s.public_id as store_id, r.created_at from public.store_reviews r join public.stores s on s.id = r.store_id
        where r.author_id = target order by r.created_at desc limit 20) x),
    'reports_made', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
        select r.kind, r.target_id, r.reason, r.status, r.created_at from public.reports r where r.reporter_id = target order by r.created_at desc limit 20) x),
    'shortlisted', (select count(*) from public.shortlist_items where user_id = target),
    'audit', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
        select a.id, a.actor_name, a.action, a.target_type, a.target_id, a.detail, a.created_at from public.admin_audit a
        where (a.target_type = 'person' and a.target_id = target::text) or a.actor_id = target order by a.created_at desc limit 50) x)
  );
end;
$$;

revoke execute on function public.admin_store(text) from public, anon;
revoke execute on function public.admin_person(uuid) from public, anon;
grant execute on function public.admin_store(text) to authenticated;
grant execute on function public.admin_person(uuid) to authenticated;
