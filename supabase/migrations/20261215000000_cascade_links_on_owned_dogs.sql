-- Deleting a store, a listed dog, a care provider or a care booking, 12 Nov: buyers' own dogs and their records
-- point at those (the store a dog came from, the provider who added a line). When one is deleted, the database
-- clears the link ("on delete set null"), which is an update on the buyer's row. The owner-only checks on those
-- rows refused it ("Not your dog" / "Sign in first"), because whoever deleted the store or provider isn't the
-- dog's owner, so removing a provider in Admin > Care directory, or clearing demo data, failed.
-- Now a change that only clears those links (everything else the same) is let through; every other change still
-- has to come from the dog's owner. Runs after 20261214000000_provider_bookings_history.sql.

create or replace function public.check_owned_dog()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  -- The database clearing the link to a deleted store or listing
  if tg_op = 'UPDATE'
    and (new.store_id is null or new.dog_id is null)
    and (new.store_id is distinct from old.store_id or new.dog_id is distinct from old.dog_id)
    and (new.owner_id, new.name, new.breed, new.sex, new.born_on, new.weight_kg, new.microchip, new.level, new.photo_path, new.came_from, new.got_on, new.notes)
      is not distinct from (old.owner_id, old.name, old.breed, old.sex, old.born_on, old.weight_kg, old.microchip, old.level, old.photo_path, old.came_from, old.got_on, old.notes)
    and (new.store_id is null or new.store_id = old.store_id)
    and (new.dog_id is null or new.dog_id = old.dog_id) then
    return new;
  end if;
  new.owner_id := auth.uid();
  if new.owner_id is null then raise exception 'Sign in first'; end if;
  if tg_op = 'INSERT' and (select count(*) from public.owned_dogs where owner_id = new.owner_id) >= 20 then
    raise exception 'You can keep up to 20 dogs here';
  end if;
  if new.photo_path is not null and split_part(new.photo_path, '/', 1) <> new.owner_id::text then
    raise exception 'That photo isn''t yours';
  end if;
  return new;
end;
$$;

create or replace function public.check_owned_dog_record()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if current_setting('dogeash.provider_record', true) = 'on' and tg_op = 'INSERT' then
    return new;
  end if;
  -- The database clearing the link to a deleted provider or booking
  if tg_op = 'UPDATE'
    and (new.provider_id is null or new.care_booking_id is null)
    and (new.provider_id is distinct from old.provider_id or new.care_booking_id is distinct from old.care_booking_id)
    and (new.owner_id, new.owned_dog_id, new.kind, new.title, new.done_on, new.due_on, new.by_whom, new.note)
      is not distinct from (old.owner_id, old.owned_dog_id, old.kind, old.title, old.done_on, old.due_on, old.by_whom, old.note)
    and (new.provider_id is null or new.provider_id = old.provider_id)
    and (new.care_booking_id is null or new.care_booking_id = old.care_booking_id) then
    return new;
  end if;
  new.owner_id := auth.uid();
  if not exists (select 1 from public.owned_dogs d where d.id = new.owned_dog_id and d.owner_id = new.owner_id) then
    raise exception 'Not your dog';
  end if;
  -- Who added a line is never the owner's to change
  if tg_op = 'UPDATE' then
    new.provider_id := old.provider_id;
    new.care_booking_id := old.care_booking_id;
  end if;
  if tg_op = 'INSERT' then
    new.provider_id := null;
    new.care_booking_id := null;
    if (select count(*) from public.owned_dog_records where owned_dog_id = new.owned_dog_id) >= 300 then
      raise exception 'This dog''s record is full';
    end if;
  end if;
  return new;
end;
$$;
