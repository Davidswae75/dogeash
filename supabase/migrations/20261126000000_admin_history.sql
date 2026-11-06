-- Longer history for the admin overview: the same day-by-day figures as admin_series() (new accounts, visit
-- requests, messages, reviews, dog listings; Lagos days), for any number of days from 7 to 730, so the overview
-- can show 90 days or a year and compare each with the period before.

create function public.admin_history(days int)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  n int := least(greatest(coalesce(days, 60), 7), 730);
  first_day date := (now() at time zone 'Africa/Lagos')::date - (n - 1);
begin
  perform public.require_staff('{admin}');
  return (
    with days as (
      select generate_series(first_day, (now() at time zone 'Africa/Lagos')::date, interval '1 day')::date as day
    ),
    per_day as (
      select 'accounts' as k, (created_at at time zone 'Africa/Lagos')::date as day, count(*) as c from public.profiles where created_at >= first_day group by 2
      union all select 'visits', (created_at at time zone 'Africa/Lagos')::date, count(*) from public.visits where created_at >= first_day group by 2
      union all select 'messages', (created_at at time zone 'Africa/Lagos')::date, count(*) from public.messages where created_at >= first_day group by 2
      union all select 'reviews', (created_at at time zone 'Africa/Lagos')::date, count(*) from public.store_reviews where created_at >= first_day group by 2
      union all select 'dogs', (created_at at time zone 'Africa/Lagos')::date, count(*) from public.dogs where created_at >= first_day group by 2
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'day', d.day,
      'accounts', coalesce((select c from per_day p where p.k = 'accounts' and p.day = d.day), 0),
      'visits', coalesce((select c from per_day p where p.k = 'visits' and p.day = d.day), 0),
      'messages', coalesce((select c from per_day p where p.k = 'messages' and p.day = d.day), 0),
      'reviews', coalesce((select c from per_day p where p.k = 'reviews' and p.day = d.day), 0),
      'dogs', coalesce((select c from per_day p where p.k = 'dogs' and p.day = d.day), 0)
    ) order by d.day), '[]')
    from days d
  );
end;
$$;

revoke execute on function public.admin_history(int) from public, anon;
grant execute on function public.admin_history(int) to authenticated;
