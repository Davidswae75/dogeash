-- Reports and blocking.
-- Reports: anyone signed in can report a dog listing, a store, a review or a conversation (scam, wrong
-- information, abuse, animal welfare, other), up to 20 a day and once per thing while it's open. Admins see
-- them in a queue, resolve or dismiss them with a note the reporter reads, and can read a reported
-- conversation (that reading is logged). Admins are told about each new report.
-- Blocking: admins block an account with a reason. A blocked account can still sign in and read, but every
-- write is refused by "restrictive" access rules that sit on top of all the others: no messages, visits,
-- reviews, listings, store changes, saves or uploads. The person sees why. Staff can't be blocked.

alter type public.notification_kind add value if not exists 'report';

-- ── Blocking ────────────────────────────────────────────────────────────────
create table public.blocked_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason text not null check (length(trim(reason)) between 3 and 500),
  blocked_by uuid references auth.users (id) on delete set null,
  blocked_at timestamptz not null default now()
);

create function public.is_blocked()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.blocked_accounts where user_id = (select auth.uid())) $$;

-- For the blocked person: why, and since when (null when not blocked)
create function public.my_block()
returns jsonb language sql stable security definer set search_path = ''
as $$ select to_jsonb(x) from (select reason, blocked_at from public.blocked_accounts where user_id = (select auth.uid())) x $$;

create function public.admin_block_person(target uuid, reason text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  why text := trim(coalesce(reason, ''));
  who text;
begin
  perform public.require_staff('{admin}');
  if length(why) < 3 then raise exception 'Give a reason'; end if;
  if target = auth.uid() then raise exception 'You can''t block yourself'; end if;
  if exists (select 1 from public.staff where user_id = target) then raise exception 'Staff can''t be blocked'; end if;
  insert into public.blocked_accounts (user_id, reason, blocked_by) values (target, left(why, 500), auth.uid())
  on conflict (user_id) do update set reason = excluded.reason, blocked_by = excluded.blocked_by, blocked_at = now();
  select coalesce(nullif(p.full_name, ''), u.email) into who from auth.users u left join public.profiles p on p.id = u.id where u.id = target;
  perform public.admin_log('person.block', 'person', target::text, jsonb_build_object('name', who, 'note', why));
end;
$$;

create function public.admin_unblock_person(target uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  who text;
begin
  perform public.require_staff('{admin}');
  delete from public.blocked_accounts where user_id = target;
  if not found then raise exception 'That account isn''t blocked'; end if;
  select coalesce(nullif(p.full_name, ''), u.email) into who from auth.users u left join public.profiles p on p.id = u.id where u.id = target;
  perform public.admin_log('person.unblock', 'person', target::text, jsonb_build_object('name', who));
end;
$$;

-- Restrictive rules: on top of every other rule, a blocked account can't add or change anything
do $$
declare
  rule record;
begin
  for rule in select * from (values
    ('conversations', 'insert'), ('messages', 'insert'),
    ('visits', 'insert'), ('visits', 'update'),
    ('store_reviews', 'insert'), ('store_reviews', 'update'),
    ('dogs', 'insert'), ('dogs', 'update'), ('dogs', 'delete'),
    ('stores', 'insert'), ('stores', 'update'), ('stores', 'delete'),
    ('store_members', 'insert'), ('store_members', 'update'),
    ('store_invites', 'insert'), ('store_care_links', 'insert'), ('store_care_links', 'update'), ('store_care_links', 'delete'),
    ('store_applications', 'insert'), ('store_applications', 'update'),
    ('shortlist_items', 'insert'), ('shortlist_items', 'update'),
    ('saved_searches', 'insert'), ('saved_searches', 'update'),
    ('profiles', 'update')
  ) as t (tbl, act) loop
    execute format(
      'create policy %I on public.%I as restrictive for %s to authenticated %s',
      'Blocked accounts can''t ' || rule.act, rule.tbl, rule.act,
      case rule.act
        when 'insert' then 'with check (not public.is_blocked())'
        when 'update' then 'using (not public.is_blocked()) with check (not public.is_blocked())'
        else 'using (not public.is_blocked())' end);
  end loop;
end;
$$;
create policy "Blocked accounts can't upload" on storage.objects as restrictive for insert to authenticated with check (not public.is_blocked());
create policy "Blocked accounts can't replace files" on storage.objects as restrictive for update to authenticated using (not public.is_blocked()) with check (not public.is_blocked());

-- ── Reports ─────────────────────────────────────────────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('dog', 'store', 'review', 'conversation')),
  target_id text not null check (length(target_id) between 1 and 80),
  reason text not null check (reason in ('scam', 'wrong_info', 'abuse', 'welfare', 'other')),
  details text not null default '' check (length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution text not null default '' check (length(resolution) <= 500),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index reports_one_open on public.reports (reporter_id, kind, target_id) where status = 'open';
create index reports_status_idx on public.reports (status, created_at desc);

-- A new report: always from the signed-in person, about something they can see, 20 a day at most; admins told
create function public.prepare_report()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.reporter_id := auth.uid();
  new.status := 'open';
  new.resolution := '';
  new.resolved_by := null;
  new.resolved_at := null;
  if new.reporter_id is null then raise exception 'Sign in first'; end if;
  if (select count(*) from public.reports where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 20 then
    raise exception 'You''ve sent a lot of reports today. Try again tomorrow';
  end if;
  if new.kind = 'conversation' and not exists (
    select 1 from public.conversations c where c.id::text = new.target_id
      and (c.buyer_id = new.reporter_id or public.has_store_role(c.store_id, '{owner,manager,handler}'))
  ) then raise exception 'Not your conversation'; end if;
  return new;
end;
$$;
create trigger reports_prepare before insert on public.reports for each row execute function public.prepare_report();

create function public.notify_report()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform public.notify(s.user_id, 'report', 'New report: ' || new.kind || ' (' || replace(new.reason, '_', ' ') || ')',
    coalesce(nullif(left(new.details, 200), ''), 'Open Reports to look into it.'), '/admin/reports', 'report:' || new.id)
  from public.staff s where s.role = 'admin';
  return new;
end;
$$;
create trigger reports_notify after insert on public.reports for each row execute function public.notify_report();

-- What a report is about, in words, with a link for admins (dog name, store name, review excerpt …)
create function public.report_target(kind text, target text)
returns jsonb language sql stable security definer set search_path = ''
as $$
  select case kind
    when 'dog' then (select jsonb_build_object('label', d.name || ' · ' || d.file_no || ' · ' || s.name, 'link', '/admin/listings', 'status', d.status)
      from public.dogs d join public.stores s on s.id = d.store_id where d.file_no = target)
    when 'store' then (select jsonb_build_object('label', s.name || ' · ' || s.public_id, 'link', '/admin/stores', 'status', s.status)
      from public.stores s where s.public_id = target)
    when 'review' then (select jsonb_build_object('label', r.rating || '/5 on ' || s.name || ': "' || left(r.body, 120) || '"', 'link', '/admin/reviews', 'status', 'live')
      from public.store_reviews r join public.stores s on s.id = r.store_id where r.id::text = target)
    when 'conversation' then (select jsonb_build_object('label', c.buyer_name || ' and ' || s.name, 'link', '/admin/reports', 'status', 'open')
      from public.conversations c join public.stores s on s.id = c.store_id where c.id::text = target)
  end
$$;

create function public.admin_reports()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
    select r.id, r.kind, r.target_id, r.reason, r.details, r.status, r.resolution, r.resolved_at, r.created_at,
      coalesce(nullif(p.full_name, ''), u.email) as reporter, u.email as reporter_email,
      coalesce(public.report_target(r.kind, r.target_id), jsonb_build_object('label', 'No longer on Dogeash', 'link', null, 'status', 'gone')) as target,
      (select count(*) from public.reports o where o.kind = r.kind and o.target_id = r.target_id and o.status = 'open') as open_on_target
    from public.reports r join auth.users u on u.id = r.reporter_id left join public.profiles p on p.id = r.reporter_id
    order by r.created_at desc limit 500
  ) x);
end;
$$;

create function public.admin_open_reports()
returns int language sql stable security definer set search_path = ''
as $$ select case when public.is_staff('{admin}') then (select count(*)::int from public.reports where status = 'open') else 0 end $$;

-- A reported conversation's messages. Reading private messages is only allowed through a report, and it's logged.
create function public.admin_report_messages(report uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  r record;
begin
  perform public.require_staff('{admin}');
  select * into r from public.reports where id = report;
  if r is null or r.kind <> 'conversation' then raise exception 'Not a conversation report'; end if;
  perform public.admin_log('report.read_messages', 'conversation', r.target_id, jsonb_build_object('report', report));
  return (select coalesce(jsonb_agg(jsonb_build_object('from', m.sender_role, 'body', m.body, 'at', m.created_at) order by m.created_at), '[]')
    from public.messages m where m.conversation_id::text = r.target_id);
end;
$$;

create function public.admin_resolve_report(target uuid, outcome text, note text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  why text := trim(coalesce(note, ''));
begin
  perform public.require_staff('{admin}');
  if outcome not in ('resolved', 'dismissed') then raise exception 'Resolve or dismiss'; end if;
  if length(why) < 3 then raise exception 'Give the reporter a note'; end if;
  update public.reports set status = outcome, resolution = left(why, 500), resolved_by = auth.uid(), resolved_at = now()
  where id = target and status = 'open' returning * into r;
  if r is null then raise exception 'That report isn''t open'; end if;
  perform public.admin_log('report.' || outcome, r.kind, r.target_id, jsonb_build_object('reason', r.reason, 'note', why));
  perform public.notify(r.reporter_id, 'report', case outcome when 'resolved' then 'We acted on your report' else 'We looked into your report' end,
    why, '/account', 'report-done:' || r.id);
end;
$$;

-- ── People: now with whether each account is blocked ───────────────────────
create or replace function public.admin_people(q text default '')
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
      (select count(*) from public.shortlist_items i where i.user_id = u.id) as shortlisted,
      (select to_jsonb(b) from (select reason, blocked_at from public.blocked_accounts ba where ba.user_id = u.id) b) as blocked
    from auth.users u left join public.profiles p on p.id = u.id
    where trim(coalesce(q, '')) = ''
      or lower(coalesce(p.full_name, '')) like term or lower(coalesce(u.email, '')) like term or lower(coalesce(p.phone, '')) like term
    order by u.created_at desc limit 200
  ) x);
end;
$$;

-- ── Access ──────────────────────────────────────────────────────────────────
alter table public.blocked_accounts enable row level security;
alter table public.reports enable row level security;
revoke all on public.blocked_accounts, public.reports from anon, authenticated;

create policy "See your own reports" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy "Report what you can see" on public.reports for insert to authenticated with check (true);
create policy "Blocked accounts can't insert" on public.reports as restrictive for insert to authenticated with check (not public.is_blocked());
grant select on public.reports to authenticated;
grant insert (kind, target_id, reason, details) on public.reports to authenticated;

revoke execute on function public.is_blocked() from public, anon;
revoke execute on function public.my_block() from public, anon;
revoke execute on function public.admin_block_person(uuid, text) from public, anon;
revoke execute on function public.admin_unblock_person(uuid) from public, anon;
revoke execute on function public.prepare_report() from public, anon, authenticated;
revoke execute on function public.notify_report() from public, anon, authenticated;
revoke execute on function public.report_target(text, text) from public, anon, authenticated;
revoke execute on function public.admin_reports() from public, anon;
revoke execute on function public.admin_open_reports() from public, anon;
revoke execute on function public.admin_report_messages(uuid) from public, anon;
revoke execute on function public.admin_resolve_report(uuid, text, text) from public, anon;
grant execute on function public.is_blocked() to authenticated;
grant execute on function public.my_block() to authenticated;
grant execute on function public.admin_block_person(uuid, text) to authenticated;
grant execute on function public.admin_unblock_person(uuid) to authenticated;
grant execute on function public.admin_reports() to authenticated;
grant execute on function public.admin_open_reports() to authenticated;
grant execute on function public.admin_report_messages(uuid) to authenticated;
grant execute on function public.admin_resolve_report(uuid, text, text) to authenticated;
