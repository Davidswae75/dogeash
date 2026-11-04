-- Stores manage their own dogs from the dashboard.
--   · Dogeash gives every new dog its K9 file number (KD-<year>-<n>); stores never type one.
--   · The "inspected" line of a dog's file is Dogeash's to write, never the store's.
--   · Dog photos live in the public `dog-photos` bucket, one folder per store (its database id).
--     The public reads them by URL; only that store's people can add, replace or remove them.

-- ── File numbers ────────────────────────────────────────────────────────────
-- Starts at 100, clear of the hand-numbered sample dogs
create sequence public.dog_file_seq start 100;

create function public.prepare_dog()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  -- People using the app can't send a file number (no column grant), so one is always assigned here.
  -- The seed and Dogeash staff (SQL editor, no signed-in user) may set both directly.
  if new.file_no is null then
    new.file_no := 'KD-' || extract(year from now())::int || '-' || lpad(nextval('public.dog_file_seq')::text, 3, '0');
  end if;
  if auth.uid() is null then return new; end if;

  if tg_op = 'INSERT' then
    new.file := coalesce(new.file, '{}'::jsonb) - 'inspected';
  else
    -- Keep Dogeash's inspection line whatever the store sends
    new.file := case
      when old.file ? 'inspected' then coalesce(new.file, '{}'::jsonb) || jsonb_build_object('inspected', old.file -> 'inspected')
      else coalesce(new.file, '{}'::jsonb) - 'inspected'
    end;
  end if;
  return new;
end;
$$;
revoke execute on function public.prepare_dog() from public, anon, authenticated;
create trigger dogs_prepare before insert or update on public.dogs for each row execute function public.prepare_dog();

-- The number is assigned, so it's no longer something to insert
revoke insert on public.dogs from authenticated;
grant insert (store_id, name, breed, sex, city, age, weight_kg, hips, level, price_naira, status, photo_path, property, safe_with_children, file) on public.dogs to authenticated;

-- Sanity limits on what a store can type
alter table public.dogs
  add constraint dogs_name_length check (length(trim(name)) between 1 and 40),
  add constraint dogs_breed_length check (length(trim(breed)) between 2 and 60),
  add constraint dogs_age_length check (length(trim(age)) between 1 and 30),
  add constraint dogs_weight_range check (weight_kg <= 120),
  add constraint dogs_price_range check (price_naira <= 1000000000);

-- ── Photos ──────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dog-photos', 'dog-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Is this storage path inside a store folder the signed-in person works at?
create function public.can_manage_dog_photo(path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.store_members m
    where m.user_id = auth.uid() and m.store_id::text = split_part(path, '/', 1)
  )
$$;
revoke execute on function public.can_manage_dog_photo(text) from public, anon;
grant execute on function public.can_manage_dog_photo(text) to authenticated;

create policy "Store people add dog photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'dog-photos' and public.can_manage_dog_photo(name));
create policy "Store people replace dog photos" on storage.objects for update to authenticated
  using (bucket_id = 'dog-photos' and public.can_manage_dog_photo(name))
  with check (bucket_id = 'dog-photos' and public.can_manage_dog_photo(name));
create policy "Store people remove dog photos" on storage.objects for delete to authenticated
  using (bucket_id = 'dog-photos' and public.can_manage_dog_photo(name));
create policy "Store people list dog photos" on storage.objects for select to authenticated
  using (bucket_id = 'dog-photos' and public.can_manage_dog_photo(name));
