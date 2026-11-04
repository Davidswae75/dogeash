-- More than one photo per dog, and videos. Besides its main photo (photo_path), a dog can have up to 8 more
-- photos (gallery_paths, in the dog-photos bucket) and up to 4 videos (videos: path, kind and a short title,
-- in the new dog-videos bucket). A store can only use files in its own folder ("<store id>/…").
-- Videos are MP4, WebM or MOV up to 50 MB; the public reads them by URL, only the store's people add or remove them.

alter table public.dogs
  add column gallery_paths text[] not null default '{}',
  add column videos jsonb not null default '[]';

-- The gallery and videos point only into this store's folder; videos say what they show
create function public.dog_media_ok(store uuid, gallery text[], vids jsonb)
returns boolean language sql immutable set search_path = ''
as $$
  select cardinality(gallery) <= 8
    and not exists (select 1 from unnest(gallery) g where g not like store::text || '/%')
    and jsonb_typeof(vids) = 'array' and jsonb_array_length(vids) <= 4
    and not exists (
      select 1 from jsonb_array_elements(vids) v
      where jsonb_typeof(v) <> 'object'
        or coalesce(v ->> 'path', '') not like store::text || '/%'
        or coalesce(v ->> 'kind', '') not in ('obedience', 'protection', 'temperament', 'health', 'other')
        or length(coalesce(v ->> 'title', '')) > 60
    )
$$;

alter table public.dogs add constraint dogs_media_valid check (public.dog_media_ok(store_id, gallery_paths, videos));

grant insert (gallery_paths, videos) on public.dogs to authenticated;
grant update (gallery_paths, videos) on public.dogs to authenticated;

-- Videos: their own bucket, larger files, video types only. Same folder rule as dog photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dog-videos', 'dog-videos', true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do nothing;

create policy "Store people add dog videos" on storage.objects for insert to authenticated
  with check (bucket_id = 'dog-videos' and public.can_manage_dog_photo(name));
create policy "Store people replace dog videos" on storage.objects for update to authenticated
  using (bucket_id = 'dog-videos' and public.can_manage_dog_photo(name))
  with check (bucket_id = 'dog-videos' and public.can_manage_dog_photo(name));
create policy "Store people remove dog videos" on storage.objects for delete to authenticated
  using (bucket_id = 'dog-videos' and public.can_manage_dog_photo(name));
create policy "Store people list dog videos" on storage.objects for select to authenticated
  using (bucket_id = 'dog-videos' and public.can_manage_dog_photo(name));
