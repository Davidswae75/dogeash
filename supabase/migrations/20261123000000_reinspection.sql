-- Re-inspection. A store stays verified for a year after its last passed inspection (or approval):
-- `verified_until`. Passing an inspection again (or being approved again) moves it a year on. Thirty days before
-- it runs out, the store's owners and managers are reminded once; admins see who is overdue, due soon or later,
-- and book re-inspections. An expired store isn't hidden automatically: admins decide.
-- Reminders go out daily if the pg_cron extension is available (enable it in Supabase: Database → Extensions),
-- and admins can send them any time.

alter table public.stores add column verified_until date;

-- Stores already verified get a year from their last status change
update public.stores set verified_until = (coalesce(status_changed_at, created_at) at time zone 'Africa/Lagos')::date + 365
where status = 'verified' and verified_until is null;

-- Becoming verified, or passing a new inspection while verified, starts a fresh year (so does a store created
-- already verified, as the seed does, if it comes without a date)
create function public.extend_verification()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'verified' and new.verified_until is null then new.verified_until := (now() at time zone 'Africa/Lagos')::date + 365; end if;
  elsif new.status = 'verified' and (old.status <> 'verified' or (new.details -> 'inspection') is distinct from (old.details -> 'inspection')) then
    new.verified_until := (now() at time zone 'Africa/Lagos')::date + 365;
  end if;
  return new;
end;
$$;
create trigger stores_extend_verification before insert or update on public.stores for each row execute function public.extend_verification();

-- Remind each verified store whose year ends within 30 days, once per year (the notification topic carries the date)
create function public.send_reinspection_reminders()
returns int language plpgsql security definer set search_path = ''
as $$
declare
  st record;
  sent int := 0;
begin
  for st in
    select s.id, s.name, s.verified_until from public.stores s
    where s.status = 'verified' and s.verified_until is not null
      and s.verified_until <= (now() at time zone 'Africa/Lagos')::date + 30
      and not exists (select 1 from public.notifications n where n.topic = 'reinspection:' || s.id || ':' || s.verified_until)
  loop
    perform public.notify(m.user_id, 'store',
      case when st.verified_until < (now() at time zone 'Africa/Lagos')::date then st.name || '''s verification has run out'
        else st.name || '''s verification runs out on ' || to_char(st.verified_until, 'FMDD Mon') end,
      'Stores are inspected every year. Dogeash will call to book your re-inspection; keep your vet records ready.',
      '/dashboard', 'reinspection:' || st.id || ':' || st.verified_until)
    from public.store_members m where m.store_id = st.id and m.role in ('owner', 'manager');
    sent := sent + 1;
  end loop;
  return sent;
end;
$$;

-- For admins: verified stores by when their year runs out, with any booked inspection; and sending reminders now
create function public.admin_reinspections()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return (select coalesce(jsonb_agg(x order by x.verified_until nulls first), '[]') from (
    select s.public_id, s.name, s.city, s.verified_until, s.details -> 'inspection' ->> 'date' as last_inspected,
      (select jsonb_build_object('id', i.id, 'scheduled_for', i.scheduled_for) from public.inspections i
         where i.store_id = s.id and i.status = 'scheduled' order by i.scheduled_for limit 1) as booked
    from public.stores s where s.status = 'verified'
  ) x);
end;
$$;

create function public.admin_send_reinspection_reminders()
returns int language plpgsql security definer set search_path = ''
as $$
declare
  n int;
begin
  perform public.require_staff('{admin}');
  n := public.send_reinspection_reminders();
  perform public.admin_log('reinspection.remind', 'stores', 'all', jsonb_build_object('sent', n));
  return n;
end;
$$;

-- For a store's people: when its verification runs out
create function public.my_store_verification(target uuid)
returns date language sql stable security definer set search_path = ''
as $$ select case when public.has_store_role(target, '{owner,manager,handler}') then (select verified_until from public.stores where id = target) end $$;

-- Daily reminders at 08:00 Lagos (07:00 UTC), where pg_cron is available; skipped quietly otherwise
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('dogeash-reinspection-reminders', '0 7 * * *', 'select public.send_reinspection_reminders()');
exception when others then
  raise notice 'pg_cron not available: re-inspection reminders run only when an admin sends them';
end;
$$;

revoke execute on function public.extend_verification() from public, anon, authenticated;
revoke execute on function public.send_reinspection_reminders() from public, anon, authenticated;
revoke execute on function public.admin_reinspections() from public, anon;
revoke execute on function public.admin_send_reinspection_reminders() from public, anon;
revoke execute on function public.my_store_verification(uuid) from public, anon;
grant execute on function public.admin_reinspections() to authenticated;
grant execute on function public.admin_send_reinspection_reminders() to authenticated;
grant execute on function public.my_store_verification(uuid) to authenticated;
