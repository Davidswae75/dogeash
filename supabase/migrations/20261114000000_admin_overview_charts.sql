-- Charts for the admin overview: the last 60 days day by day (Lagos time), the stores with the most live
-- dogs, and where the live dogs are. admin_overview() is the same as before with three more parts:
-- `series`, `topStores` and `cities`.

-- New accounts, visit requests, messages, reviews and dog listings per day, oldest first
create function public.admin_series()
returns jsonb language sql stable security definer set search_path = ''
as $$
  with days as (
    select generate_series((now() at time zone 'Africa/Lagos')::date - 59, (now() at time zone 'Africa/Lagos')::date, interval '1 day')::date as day
  ),
  since as (select ((now() at time zone 'Africa/Lagos')::date - 59) as day),
  per_day as (
    select 'accounts' as k, (created_at at time zone 'Africa/Lagos')::date as day, count(*) as n from public.profiles, since where created_at >= since.day group by 2
    union all select 'visits', (created_at at time zone 'Africa/Lagos')::date, count(*) from public.visits, since where created_at >= since.day group by 2
    union all select 'messages', (created_at at time zone 'Africa/Lagos')::date, count(*) from public.messages, since where created_at >= since.day group by 2
    union all select 'reviews', (created_at at time zone 'Africa/Lagos')::date, count(*) from public.store_reviews, since where created_at >= since.day group by 2
    union all select 'dogs', (created_at at time zone 'Africa/Lagos')::date, count(*) from public.dogs, since where created_at >= since.day group by 2
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'day', d.day,
    'accounts', coalesce((select n from per_day p where p.k = 'accounts' and p.day = d.day), 0),
    'visits', coalesce((select n from per_day p where p.k = 'visits' and p.day = d.day), 0),
    'messages', coalesce((select n from per_day p where p.k = 'messages' and p.day = d.day), 0),
    'reviews', coalesce((select n from per_day p where p.k = 'reviews' and p.day = d.day), 0),
    'dogs', coalesce((select n from per_day p where p.k = 'dogs' and p.day = d.day), 0)
  ) order by d.day), '[]')
  from days d
$$;
revoke execute on function public.admin_series() from public, anon, authenticated;

create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  week timestamptz := now() - interval '7 days';
begin
  perform public.require_staff('{admin,inspector}');
  return jsonb_build_object(
    'accounts', (select count(*) from public.profiles),
    'accountsWeek', (select count(*) from public.profiles where created_at >= week),
    'stores', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from public.stores group by status) x),
    'dogs', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from public.dogs group by status) x),
    'visits', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from public.visits group by status) x),
    'visitsWeek', (select count(*) from public.visits where created_at >= week),
    'conversationsWeek', (select count(*) from public.conversations where created_at >= week),
    'messagesWeek', (select count(*) from public.messages where created_at >= week),
    'reviews', (select count(*) from public.store_reviews),
    'reviewsWeek', (select count(*) from public.store_reviews where created_at >= week),
    'rating', (select round(avg(rating), 2) from public.store_reviews),
    'careProviders', (select count(*) from public.care_providers),
    'staff', (select count(*) from public.staff),
    'waiting', jsonb_build_object(
      'storesInReview', (select count(*) from public.stores where status = 'in_review'),
      'dogsPendingReview', (select count(*) from public.dogs where status = 'pending_review'),
      'visitsUnanswered', (select count(*) from public.visits where status = 'requested' and created_at < now() - interval '2 days'),
      'reviewsUnanswered', (select count(*) from public.store_reviews where store_reply is null)
    ),
    'series', public.admin_series(),
    'topStores', (select coalesce(jsonb_agg(x), '[]') from (
      select s.public_id, s.name, s.city, s.rating, s.reviews_count,
        (select count(*) from public.dogs d where d.store_id = s.id and d.status in ('available', 'reserved')) as live_dogs,
        (select count(*) from public.visits v where v.store_id = s.id and v.created_at >= now() - interval '30 days') as visits_30
      from public.stores s where s.status = 'verified'
      order by live_dogs desc, s.reviews_count desc limit 6) x),
    'cities', (select coalesce(jsonb_agg(x), '[]') from (
      select city, count(*) as dogs from public.dogs where status in ('available', 'reserved')
      group by city order by count(*) desc, city limit 8) x),
    'newest', jsonb_build_object(
      'stores', (select coalesce(jsonb_agg(x), '[]') from (select public_id, name, city, status, created_at from public.stores order by created_at desc limit 5) x),
      'reviews', (select coalesce(jsonb_agg(x), '[]') from (select r.id, s.name as store, r.rating, left(r.body, 120) as body, r.created_at from public.store_reviews r join public.stores s on s.id = r.store_id order by r.created_at desc limit 5) x)
    )
  );
end;
$$;
