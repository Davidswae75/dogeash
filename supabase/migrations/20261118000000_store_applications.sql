-- Store applications. A draft store's owner fills in an application (the kennel's address and directions,
-- a phone for the inspector, preferred inspection days) and uploads documents (ID, CAC certificate unless not
-- registered yet, optional proof of address) to a PRIVATE bucket. Sending it puts the store in review and tells
-- the admins. While in review, the application is locked; sending a store back (admin) opens it again.
-- Only the store's owner and admins with a one-time code can see the application or open the documents.

create table public.store_applications (
  store_id uuid primary key references public.stores (id) on delete cascade,
  address text not null default '' check (length(address) <= 300),
  directions text not null default '' check (length(directions) <= 500),
  contact_phone text not null default '' check (length(contact_phone) <= 40),
  preferred_days date[] not null default '{}' check (cardinality(preferred_days) <= 3),
  cac_registered boolean not null default true,
  id_doc_path text,
  cac_doc_path text,
  address_doc_path text,
  note text not null default '' check (length(note) <= 1000),
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);
create trigger store_applications_updated_at before update on public.store_applications for each row execute function public.set_updated_at();

-- Documents point only into this store's folder
alter table public.store_applications add constraint store_applications_docs_own_folder check (
  (id_doc_path is null or id_doc_path like store_id::text || '/%')
  and (cac_doc_path is null or cac_doc_path like store_id::text || '/%')
  and (address_doc_path is null or address_doc_path like store_id::text || '/%')
);

-- An application can only change while its store is a draft (not in review, verified or suspended)
create function public.store_is_draft(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.stores where id = target and status = 'draft') $$;

-- ── Sending it ──────────────────────────────────────────────────────────────
-- Everything an inspection needs, checked; then the store goes into review and the admins are told
create function public.submit_store_application(target uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  st record;
  app record;
begin
  if not public.has_store_role(target, '{owner}') then raise exception 'Only the store''s owner can send its application'; end if;
  select id, name, status, tagline, details into st from public.stores where id = target;
  if st.status <> 'draft' then raise exception 'This store isn''t a draft'; end if;
  if length(coalesce(st.tagline, '')) < 10 or length(coalesce(st.details ->> 'about', '')) < 40 or length(coalesce(st.details -> 'owner' ->> 'name', '')) < 2 then
    raise exception 'Finish the store profile first';
  end if;
  if not exists (select 1 from public.dogs where store_id = target) then raise exception 'Add at least one dog first'; end if;
  select * into app from public.store_applications where store_id = target;
  if app is null or length(trim(app.address)) < 10 or length(trim(app.contact_phone)) < 7 then raise exception 'Add the kennel''s address and a phone for the inspector'; end if;
  if cardinality(app.preferred_days) < 1 then raise exception 'Choose at least one inspection day'; end if;
  if app.id_doc_path is null then raise exception 'Upload the owner''s ID'; end if;
  if app.cac_registered and app.cac_doc_path is null then raise exception 'Upload the CAC certificate, or say the kennel isn''t registered yet'; end if;

  update public.store_applications set submitted_at = now() where store_id = target;
  update public.stores set status = 'in_review', status_note = '', status_changed_at = now() where id = target;
  perform public.notify(s.user_id, 'store', 'New store application: ' || st.name, 'Waiting for review in Applications.', '/admin/applications', 'application:' || target)
  from public.staff s where s.role = 'admin';
end;
$$;

-- ── For admins ──────────────────────────────────────────────────────────────
-- Stores in review (and drafts with an application started), with their application, owner, profile and dogs
create function public.admin_applications()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return (select coalesce(jsonb_agg(x order by x.submitted_at desc nulls last), '[]') from (
    select s.public_id, s.name, s.city, s.area, s.state, s.status, s.status_note, s.tagline,
      s.details ->> 'about' as about, s.details -> 'owner' as owner_profile, s.created_at,
      a.address, a.directions, a.contact_phone, a.preferred_days, a.cac_registered, a.note,
      a.id_doc_path, a.cac_doc_path, a.address_doc_path, a.submitted_at, a.updated_at,
      (select jsonb_build_object('name', coalesce(nullif(p.full_name, ''), u.email), 'email', u.email, 'phone', p.phone)
         from public.store_members m join auth.users u on u.id = m.user_id left join public.profiles p on p.id = m.user_id
         where m.store_id = s.id and m.role = 'owner' order by m.created_at limit 1) as owner,
      (select count(*) from public.dogs d where d.store_id = s.id) as dogs
    from public.stores s join public.store_applications a on a.store_id = s.id
    where s.status = 'in_review' or (s.status = 'draft' and a.submitted_at is not null)
  ) x);
end;
$$;

-- ── Documents: a private bucket ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-documents', 'store-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- The store's owner, for their own store's folder, and only while the store is a draft
create function public.can_manage_store_document(path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.store_members m join public.stores s on s.id = m.store_id
    where m.user_id = auth.uid() and m.role = 'owner' and s.status = 'draft' and m.store_id::text = split_part(path, '/', 1)
  )
$$;
-- Reading: the store's owner (any status), or an admin with a one-time code
create function public.can_read_store_document(path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_staff('{admin}') or exists (
    select 1 from public.store_members m
    where m.user_id = auth.uid() and m.role = 'owner' and m.store_id::text = split_part(path, '/', 1)
  )
$$;

create policy "Owners add store documents" on storage.objects for insert to authenticated
  with check (bucket_id = 'store-documents' and public.can_manage_store_document(name));
create policy "Owners replace store documents" on storage.objects for update to authenticated
  using (bucket_id = 'store-documents' and public.can_manage_store_document(name))
  with check (bucket_id = 'store-documents' and public.can_manage_store_document(name));
create policy "Owners remove store documents" on storage.objects for delete to authenticated
  using (bucket_id = 'store-documents' and public.can_manage_store_document(name));
create policy "Owners and admins read store documents" on storage.objects for select to authenticated
  using (bucket_id = 'store-documents' and public.can_read_store_document(name));

-- ── Access ──────────────────────────────────────────────────────────────────
alter table public.store_applications enable row level security;
create policy "Owners read their application" on public.store_applications for select to authenticated
  using (public.has_store_role(store_id, '{owner}'));
create policy "Owners start their application while a draft" on public.store_applications for insert to authenticated
  with check (public.has_store_role(store_id, '{owner}') and public.store_is_draft(store_id));
create policy "Owners edit their application while a draft" on public.store_applications for update to authenticated
  using (public.has_store_role(store_id, '{owner}') and public.store_is_draft(store_id))
  with check (public.has_store_role(store_id, '{owner}') and public.store_is_draft(store_id));

revoke all on public.store_applications from anon, authenticated;
grant select on public.store_applications to authenticated;
grant insert (store_id, address, directions, contact_phone, preferred_days, cac_registered, id_doc_path, cac_doc_path, address_doc_path, note) on public.store_applications to authenticated;
grant update (address, directions, contact_phone, preferred_days, cac_registered, id_doc_path, cac_doc_path, address_doc_path, note) on public.store_applications to authenticated;

revoke execute on function public.store_is_draft(uuid) from public, anon;
revoke execute on function public.can_manage_store_document(text) from public, anon;
revoke execute on function public.can_read_store_document(text) from public, anon;
revoke execute on function public.submit_store_application(uuid) from public, anon;
revoke execute on function public.admin_applications() from public, anon;
grant execute on function public.store_is_draft(uuid) to authenticated;
grant execute on function public.can_manage_store_document(text) to authenticated;
grant execute on function public.can_read_store_document(text) to authenticated;
grant execute on function public.submit_store_application(uuid) to authenticated;
grant execute on function public.admin_applications() to authenticated;
