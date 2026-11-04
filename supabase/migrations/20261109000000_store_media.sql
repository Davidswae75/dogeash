-- Store banner and logo. Images live in the public `store-media` bucket, one folder per store (its database id).
-- The public reads them by URL; only that store's owners and managers (who edit the profile) can add,
-- replace or remove them. A store can only point at images in its own folder.

alter table public.stores
  add column banner_path text,
  add column logo_path text,
  add constraint stores_banner_own_folder check (banner_path is null or banner_path like id::text || '/%'),
  add constraint stores_logo_own_folder check (logo_path is null or logo_path like id::text || '/%');

grant update (banner_path, logo_path) on public.stores to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-media', 'store-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Is this storage path inside the folder of a store the signed-in person owns or manages?
create function public.can_manage_store_media(path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.store_members m
    where m.user_id = auth.uid() and m.role in ('owner', 'manager') and m.store_id::text = split_part(path, '/', 1)
  )
$$;
revoke execute on function public.can_manage_store_media(text) from public, anon;
grant execute on function public.can_manage_store_media(text) to authenticated;

create policy "Owners and managers add store images" on storage.objects for insert to authenticated
  with check (bucket_id = 'store-media' and public.can_manage_store_media(name));
create policy "Owners and managers replace store images" on storage.objects for update to authenticated
  using (bucket_id = 'store-media' and public.can_manage_store_media(name))
  with check (bucket_id = 'store-media' and public.can_manage_store_media(name));
create policy "Owners and managers remove store images" on storage.objects for delete to authenticated
  using (bucket_id = 'store-media' and public.can_manage_store_media(name));
create policy "Owners and managers list store images" on storage.objects for select to authenticated
  using (bucket_id = 'store-media' and public.can_manage_store_media(name));
