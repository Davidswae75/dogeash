-- Announcements from Dogeash: a title and message sent to everyone, to stores (everyone on a store's team) or
-- to buyers (everyone else), into each person's bell. Optionally also shown as a strip across the top of the
-- site until a date, for visitors too (downtime, policy changes). Admins only; each one is in the audit log.

alter type public.notification_kind add value if not exists 'announcement';

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('everyone', 'stores', 'buyers')),
  title text not null check (length(trim(title)) between 3 and 80),
  body text not null check (length(trim(body)) between 3 and 1000),
  link text check (link is null or link ~ '^/[^/]' or link ~ '^https://'),
  banner_until timestamptz,
  recipients int not null default 0,
  sent_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create function public.admin_send_announcement(audience text, title text, body text, link text default null, banner_until timestamptz default null)
returns int language plpgsql security definer set search_path = ''
as $$
declare
  new_id uuid;
  n int;
begin
  perform public.require_staff('{admin}');
  insert into public.announcements (audience, title, body, link, banner_until, sent_by)
  values (audience, trim(title), trim(body), nullif(trim(coalesce(link, '')), ''), banner_until, auth.uid())
  returning id into new_id;

  with recipients as (
    select u.id from auth.users u
    where admin_send_announcement.audience = 'everyone'
      or (admin_send_announcement.audience = 'stores' and exists (select 1 from public.store_members m where m.user_id = u.id))
      or (admin_send_announcement.audience = 'buyers' and not exists (select 1 from public.store_members m where m.user_id = u.id))
  )
  select count(*) into n from (
    select public.notify(r.id, 'announcement', trim(admin_send_announcement.title), trim(admin_send_announcement.body),
      coalesce(nullif(trim(coalesce(admin_send_announcement.link, '')), ''), '/'), 'announcement:' || new_id)
    from recipients r
  ) sent;

  update public.announcements set recipients = n where id = new_id;
  perform public.admin_log('announcement.send', 'announcement', new_id::text,
    jsonb_build_object('audience', audience, 'name', title, 'note', left(body, 200), 'sent', n));
  return n;
end;
$$;

create function public.admin_announcements()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
    select a.id, a.audience, a.title, a.body, a.link, a.banner_until, a.recipients, a.created_at,
      coalesce(nullif(p.full_name, ''), u.email) as sent_by
    from public.announcements a left join auth.users u on u.id = a.sent_by left join public.profiles p on p.id = a.sent_by
    order by a.created_at desc limit 100
  ) x);
end;
$$;

-- Take a site strip down early
create function public.admin_end_banner(target uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  update public.announcements set banner_until = now() where id = target and banner_until > now();
  if not found then raise exception 'That announcement isn''t showing'; end if;
  perform public.admin_log('announcement.end_banner', 'announcement', target::text, '{}');
end;
$$;

-- For everyone, visitors included: the strip to show on the site now (the newest one still running)
create function public.site_banner()
returns jsonb language sql stable security definer set search_path = ''
as $$
  select to_jsonb(x) from (
    select id, title, body, link from public.announcements
    where banner_until > now() and audience = 'everyone' order by created_at desc limit 1
  ) x
$$;

alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;

revoke execute on function public.admin_send_announcement(text, text, text, text, timestamptz) from public, anon;
revoke execute on function public.admin_announcements() from public, anon;
revoke execute on function public.admin_end_banner(uuid) from public, anon;
grant execute on function public.admin_send_announcement(text, text, text, text, timestamptz) to authenticated;
grant execute on function public.admin_announcements() to authenticated;
grant execute on function public.admin_end_banner(uuid) to authenticated;
grant execute on function public.site_banner() to anon, authenticated;
