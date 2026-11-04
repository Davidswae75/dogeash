-- Dogeash staff and the admin dashboard's foundations.
-- Staff are added only in the SQL editor, never by the site:
--   insert into public.staff (user_id, role) values ('<auth user id>', 'admin');
-- Every staff power also needs a session that passed a one-time code from an authenticator app
-- (Supabase marks it aal2), so a password alone never opens anything.
-- Admin actions are written to an audit log: who did what, to what, and when.

create type public.staff_role as enum ('admin', 'inspector');

create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.staff_role not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.admin_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text not null default '',
  action text not null,
  target_type text not null,
  target_id text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index admin_audit_created_idx on public.admin_audit (created_at desc);
create index admin_audit_target_idx on public.admin_audit (target_type, target_id);

-- ── Helpers ─────────────────────────────────────────────────────────────────
-- Is the signed-in person staff in one of these roles, in a session that passed a one-time code?
create function public.is_staff(roles public.staff_role[] default '{admin}')
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
    and exists (select 1 from public.staff s where s.user_id = (select auth.uid()) and s.role = any (roles))
$$;

-- Refuses unless the signed-in person is staff in one of these roles (with a one-time code)
create function public.require_staff(roles public.staff_role[] default '{admin}')
returns void language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_staff(roles) then raise exception 'Staff only' using errcode = '42501'; end if;
end;
$$;

-- Record an admin action (called by the admin functions, never directly)
create function public.admin_log(act text, kind text, target text, info jsonb default '{}')
returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.admin_audit (actor_id, actor_name, action, target_type, target_id, detail)
  values (auth.uid(), coalesce((select full_name from public.profiles where id = auth.uid()), ''), act, kind, target, coalesce(info, '{}'));
end;
$$;

-- ── The overview ────────────────────────────────────────────────────────────
-- Everything at a glance, as one JSON document: counts by status, the last 7 days, and what's waiting
create function public.admin_overview()
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
    'newest', jsonb_build_object(
      'stores', (select coalesce(jsonb_agg(x), '[]') from (select public_id, name, city, status, created_at from public.stores order by created_at desc limit 5) x),
      'reviews', (select coalesce(jsonb_agg(x), '[]') from (select r.id, s.name as store, r.rating, left(r.body, 120) as body, r.created_at from public.store_reviews r join public.stores s on s.id = r.store_id order by r.created_at desc limit 5) x)
    )
  );
end;
$$;

-- ── Access ──────────────────────────────────────────────────────────────────
alter table public.staff enable row level security;
alter table public.admin_audit enable row level security;

-- You can see whether you're staff (the site uses it to offer the admin dashboard); nothing else
create policy "See your own staff role" on public.staff for select to authenticated using (user_id = (select auth.uid()));
create policy "Admins read the audit log" on public.admin_audit for select to authenticated using (public.is_staff('{admin}'));

revoke all on public.staff, public.admin_audit from anon, authenticated;
grant select on public.staff to authenticated;
grant select on public.admin_audit to authenticated;

revoke execute on function public.is_staff(public.staff_role[]) from public, anon;
revoke execute on function public.require_staff(public.staff_role[]) from public, anon, authenticated;
revoke execute on function public.admin_log(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.is_staff(public.staff_role[]) to authenticated;
grant execute on function public.admin_overview() to authenticated;
