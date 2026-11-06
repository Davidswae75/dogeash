-- Visit oversight for admins: every kennel visit request with its store and buyer, which ones need chasing
-- (requested over 2 days ago, day still ahead) or were missed (day passed with no answer), how quickly each
-- store answers, and nudging a store about a waiting request (its owners and managers are told; logged).

create function public.admin_visits()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  today date := (now() at time zone 'Africa/Lagos')::date;
begin
  perform public.require_staff('{admin}');
  return jsonb_build_object(
    'visits', (select coalesce(jsonb_agg(x order by x.day desc, x.slot), '[]') from (
      select v.id, v.day, v.slot, v.status, v.service, v.place, v.store_note, v.created_at, v.updated_at,
        v.buyer_name, u.email as buyer_email, v.buyer_id, s.public_id as store_id, s.name as store_name,
        (v.status = 'requested' and v.day >= today and v.created_at < now() - interval '2 days') as needs_chasing,
        (v.status = 'requested' and v.day < today) as missed
      from public.visits v join public.stores s on s.id = v.store_id left join auth.users u on u.id = v.buyer_id
      where v.day >= today - 60 order by v.day desc limit 500
    ) x),
    -- Per store, last 90 days: requests, answered, median hours to answer (from request to the store's decision), missed
    'stores', (select coalesce(jsonb_agg(x order by x.missed desc, x.median_hours desc nulls last), '[]') from (
      select s.public_id as store_id, s.name as store_name,
        count(*) as requests,
        count(*) filter (where v.status in ('confirmed', 'declined', 'done')) as answered,
        round((percentile_cont(0.5) within group (order by extract(epoch from v.updated_at - v.created_at) / 3600)
          filter (where v.status in ('confirmed', 'declined', 'done')))::numeric, 1) as median_hours,
        count(*) filter (where v.status = 'requested' and v.day < today) as missed,
        count(*) filter (where v.status = 'requested' and v.day >= today) as waiting
      from public.visits v join public.stores s on s.id = v.store_id
      where v.created_at > now() - interval '90 days'
      group by s.public_id, s.name
    ) x)
  );
end;
$$;

-- Remind a store about a visit request it hasn't answered
create function public.admin_nudge_visit(target uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v record;
begin
  perform public.require_staff('{admin}');
  select vi.id, vi.status, vi.day, vi.slot, vi.buyer_name, s.id as store_id, s.public_id, s.name
    into v from public.visits vi join public.stores s on s.id = vi.store_id where vi.id = target;
  if v is null then raise exception 'No such visit'; end if;
  if v.status <> 'requested' then raise exception 'That visit has been answered'; end if;
  perform public.admin_log('visit.nudge', 'store', v.public_id, jsonb_build_object('buyer', v.buyer_name, 'day', v.day));
  perform public.notify(m.user_id, 'store', 'Please answer ' || coalesce(nullif(v.buyer_name, ''), 'a buyer') || '''s visit request',
    'They asked to visit on ' || to_char(v.day, 'Dy FMDD Mon') || ' at ' || v.slot || '. Confirm it, or decline with a note, from Bookings.',
    '/dashboard/bookings', 'visit-nudge:' || v.id)
  from public.store_members m where m.store_id = v.store_id and m.role in ('owner', 'manager');
end;
$$;

revoke execute on function public.admin_visits() from public, anon;
revoke execute on function public.admin_nudge_visit(uuid) from public, anon;
grant execute on function public.admin_visits() to authenticated;
grant execute on function public.admin_nudge_visit(uuid) to authenticated;
