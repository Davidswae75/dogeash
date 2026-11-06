-- Listing review policy. Platform settings (one row) say which new listings Dogeash checks before buyers see
-- them: a store's first three, level 4–5 dogs, or every new listing. All off at first (as before: verified
-- stores' dogs go live straight away). When a rule applies, a store's "go live" lands on "pending review"
-- instead, admins are told, and they approve or send it back in Listings.

create table public.platform_settings (
  id boolean primary key default true check (id),
  review_first_listings boolean not null default false,
  review_high_levels boolean not null default false,
  review_all_listings boolean not null default false,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (true) on conflict do nothing;

-- Does this dog need Dogeash's review before going live?
create function public.listing_needs_review(store uuid, dog uuid, lvl smallint)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select
    ps.review_all_listings
    or (ps.review_high_levels and lvl >= 4)
    or (ps.review_first_listings and (select count(*) from public.dogs d
          where d.store_id = store and d.id <> dog and d.status in ('available', 'reserved', 'sold')) < 3)
  from public.platform_settings ps where ps.id), false)
$$;

-- A store putting a dog live (not staff): send it for review when a rule applies
create function public.route_listing_review()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_staff('{admin,inspector}') then return new; end if;
  if new.status = 'available' and (tg_op = 'INSERT' or old.status not in ('available', 'reserved'))
    and public.listing_needs_review(new.store_id, new.id, new.level) then
    new.status := 'pending_review';
  end if;
  return new;
end;
$$;
create trigger dogs_route_listing_review before insert or update of status on public.dogs for each row execute function public.route_listing_review();

create function public.notify_listing_review()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  store_name text;
begin
  if new.status = 'pending_review' and (tg_op = 'INSERT' or old.status <> 'pending_review') then
    select name into store_name from public.stores where id = new.store_id;
    perform public.notify(s.user_id, 'store', 'Listing to review: ' || new.name, store_name || ' · ' || new.file_no || ' · level ' || new.level,
      '/admin/listings', 'listing-review:' || new.id)
    from public.staff s where s.role = 'admin';
  end if;
  return new;
end;
$$;
create trigger dogs_notify_listing_review after insert or update of status on public.dogs for each row execute function public.notify_listing_review();

-- ── Admin ───────────────────────────────────────────────────────────────────
create function public.admin_settings()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return (select to_jsonb(x) from (
    select ps.review_first_listings, ps.review_high_levels, ps.review_all_listings, ps.updated_at,
      coalesce(nullif(p.full_name, ''), u.email) as updated_by
    from public.platform_settings ps left join auth.users u on u.id = ps.updated_by left join public.profiles p on p.id = ps.updated_by
  ) x);
end;
$$;

create function public.admin_save_settings(s jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  update public.platform_settings set
    review_first_listings = coalesce((s ->> 'review_first_listings')::boolean, review_first_listings),
    review_high_levels = coalesce((s ->> 'review_high_levels')::boolean, review_high_levels),
    review_all_listings = coalesce((s ->> 'review_all_listings')::boolean, review_all_listings),
    updated_by = auth.uid(), updated_at = now()
  where id;
  perform public.admin_log('settings.save', 'settings', 'platform', s);
end;
$$;

alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from anon, authenticated;

revoke execute on function public.listing_needs_review(uuid, uuid, smallint) from public, anon, authenticated;
revoke execute on function public.route_listing_review() from public, anon, authenticated;
revoke execute on function public.notify_listing_review() from public, anon, authenticated;
revoke execute on function public.admin_settings() from public, anon;
revoke execute on function public.admin_save_settings(jsonb) from public, anon;
grant execute on function public.admin_settings() to authenticated;
grant execute on function public.admin_save_settings(jsonb) to authenticated;
