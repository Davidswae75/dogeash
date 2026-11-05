-- The admin console's sections: Listings, Reviews, People and the Care directory. Each is a set of functions
-- that check for an admin with a one-time code, act, write to the audit log, and tell whoever is affected.
--   Listings: every dog; take one down (with a reason the store reads), put it back, approve one waiting.
--   Reviews: every review; remove one with a reason the author reads (the store's rating updates).
--   People: look up accounts with their stores, roles and activity (looking only, for now).
--   Care directory: add, edit, verify and remove providers.

alter table public.dogs add column admin_note text not null default '' check (length(admin_note) <= 500);

-- Dogeash's note on a dog belongs to Dogeash's last decision: when the store moves the dog on itself, it goes
create function public.clear_dog_admin_note()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status is distinct from old.status and not public.is_staff('{admin}') then new.admin_note := ''; end if;
  return new;
end;
$$;
create trigger dogs_clear_admin_note before update of status on public.dogs for each row execute function public.clear_dog_admin_note();
revoke execute on function public.clear_dog_admin_note() from public, anon, authenticated;

-- ── Listings ────────────────────────────────────────────────────────────────
create function public.admin_dogs()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return (select coalesce(jsonb_agg(x order by x.updated_at desc), '[]') from (
    select d.id, d.file_no, d.name, d.breed, d.city, d.level, d.price_naira, d.status, d.photo_path, d.admin_note,
      d.created_at, d.updated_at, s.public_id as store_id, s.name as store_name, s.status as store_status
    from public.dogs d join public.stores s on s.id = d.store_id
  ) x);
end;
$$;

create function public.admin_set_dog_status(target uuid, next public.dog_status, note text default '')
returns void language plpgsql security definer set search_path = ''
as $$
declare
  d record;
  why text := trim(coalesce(note, ''));
begin
  perform public.require_staff('{admin}');
  select dg.id, dg.name, dg.file_no, dg.status, dg.store_id, s.status as store_status
    into d from public.dogs dg join public.stores s on s.id = dg.store_id where dg.id = target;
  if d is null then raise exception 'No such dog'; end if;
  if d.status = next then raise exception 'The dog is already %', next; end if;
  if next = 'withdrawn' and why = '' then raise exception 'Give the store a reason'; end if;
  if next in ('available', 'reserved') and d.store_status <> 'verified' then raise exception 'The store isn''t verified'; end if;

  update public.dogs set status = next, admin_note = left(why, 500) where id = d.id;
  perform public.admin_log('dog.' || next, 'dog', d.file_no, jsonb_build_object('from', d.status, 'to', next, 'note', why));
  perform public.notify(m.user_id, 'store',
    case next when 'withdrawn' then d.name || ' was taken down by Dogeash' when 'available' then d.name || ' is live' else d.name || ' was updated by Dogeash' end,
    coalesce(nullif(why, ''), 'Open the dog in your dashboard for details.'),
    '/dashboard/dogs/' || lower(d.file_no), 'dog-admin:' || d.id)
  from public.store_members m where m.store_id = d.store_id and m.role in ('owner', 'manager');
end;
$$;

-- ── Reviews ─────────────────────────────────────────────────────────────────
create function public.admin_reviews()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
    select r.id, r.rating, r.body, r.store_reply, r.replied_at, r.created_at, r.author_name, r.author_city,
      u.email as author_email, s.public_id as store_id, s.name as store_name, s.slug as store_slug
    from public.store_reviews r join public.stores s on s.id = r.store_id left join auth.users u on u.id = r.author_id
  ) x);
end;
$$;

create function public.admin_remove_review(target uuid, note text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  why text := trim(coalesce(note, ''));
begin
  perform public.require_staff('{admin}');
  if why = '' then raise exception 'Give the author a reason'; end if;
  select rv.id, rv.author_id, rv.author_name, rv.rating, rv.body, s.public_id, s.name
    into r from public.store_reviews rv join public.stores s on s.id = rv.store_id where rv.id = target;
  if r is null then raise exception 'No such review'; end if;
  delete from public.store_reviews where id = r.id;
  perform public.admin_log('review.remove', 'review', r.id::text,
    jsonb_build_object('store', r.public_id, 'author', r.author_name, 'rating', r.rating, 'body', r.body, 'note', why));
  perform public.notify(r.author_id, 'review', 'Your review of ' || r.name || ' was removed', why, '/account/bookings', 'review-removed:' || r.id);
end;
$$;

-- ── People ──────────────────────────────────────────────────────────────────
-- Accounts matching a name, email or phone (newest first, up to 200), with their stores, staff role and activity
create function public.admin_people(q text default '')
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  term text := '%' || lower(trim(coalesce(q, ''))) || '%';
begin
  perform public.require_staff('{admin}');
  return (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
    select u.id, coalesce(p.full_name, '') as name, u.email, p.phone, p.city, u.created_at, u.last_sign_in_at,
      (select role from public.staff st where st.user_id = u.id) as staff_role,
      (select coalesce(jsonb_agg(jsonb_build_object('id', s.public_id, 'name', s.name, 'status', s.status, 'role', m.role)), '[]')
         from public.store_members m join public.stores s on s.id = m.store_id where m.user_id = u.id) as stores,
      (select count(*) from public.visits v where v.buyer_id = u.id) as visits,
      (select count(*) from public.conversations c where c.buyer_id = u.id) as conversations,
      (select count(*) from public.store_reviews r where r.author_id = u.id) as reviews,
      (select count(*) from public.shortlist_items i where i.user_id = u.id) as shortlisted
    from auth.users u left join public.profiles p on p.id = u.id
    where trim(coalesce(q, '')) = ''
      or lower(coalesce(p.full_name, '')) like term or lower(coalesce(u.email, '')) like term or lower(coalesce(p.phone, '')) like term
    order by u.created_at desc limit 200
  ) x);
end;
$$;

-- ── Care directory ──────────────────────────────────────────────────────────
-- Add a provider (no `id`) or edit one (`id` = its public id, like CARE-04). Returns the public id.
create function public.admin_save_provider(p jsonb)
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
    insert into public.care_providers (public_id, slug, name, person, type, city, areas, home_visits, verified, credential, price_from)
    values (pid, sl, nm, nullif(trim(coalesce(p ->> 'person', '')), ''), (p ->> 'type')::public.care_type, trim(coalesce(p ->> 'city', '')),
      trim(coalesce(p ->> 'areas', '')), coalesce((p ->> 'homeVisits')::boolean, false), coalesce((p ->> 'verified')::boolean, false),
      trim(coalesce(p ->> 'credential', '')), coalesce((p ->> 'priceFrom')::bigint, 0));
  else
    update public.care_providers set slug = sl, name = nm, person = nullif(trim(coalesce(p ->> 'person', '')), ''),
      type = (p ->> 'type')::public.care_type, city = trim(coalesce(p ->> 'city', '')), areas = trim(coalesce(p ->> 'areas', '')),
      home_visits = coalesce((p ->> 'homeVisits')::boolean, false), verified = coalesce((p ->> 'verified')::boolean, false),
      credential = trim(coalesce(p ->> 'credential', '')), price_from = coalesce((p ->> 'priceFrom')::bigint, 0)
    where public_id = pid;
    if not found then raise exception 'No provider %', pid; end if;
  end if;
  perform public.admin_log(case when existed then 'care.edit' else 'care.add' end, 'provider', pid, p - 'id');
  return pid;
end;
$$;

create function public.admin_delete_provider(target text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  nm text;
begin
  perform public.require_staff('{admin}');
  delete from public.care_providers where public_id = target returning name into nm;
  if nm is null then raise exception 'No provider %', target; end if;
  perform public.admin_log('care.remove', 'provider', target, jsonb_build_object('name', nm));
end;
$$;

-- ── Access ──────────────────────────────────────────────────────────────────
revoke execute on function public.admin_dogs() from public, anon;
revoke execute on function public.admin_set_dog_status(uuid, public.dog_status, text) from public, anon;
revoke execute on function public.admin_reviews() from public, anon;
revoke execute on function public.admin_remove_review(uuid, text) from public, anon;
revoke execute on function public.admin_people(text) from public, anon;
revoke execute on function public.admin_save_provider(jsonb) from public, anon;
revoke execute on function public.admin_delete_provider(text) from public, anon;
grant execute on function public.admin_dogs() to authenticated;
grant execute on function public.admin_set_dog_status(uuid, public.dog_status, text) to authenticated;
grant execute on function public.admin_reviews() to authenticated;
grant execute on function public.admin_remove_review(uuid, text) to authenticated;
grant execute on function public.admin_people(text) to authenticated;
grant execute on function public.admin_save_provider(jsonb) to authenticated;
grant execute on function public.admin_delete_provider(text) to authenticated;
