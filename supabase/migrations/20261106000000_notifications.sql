-- Notifications for the header bell. The database writes them when something happens, so they're right
-- whoever caused it and from whichever device: a store replies, confirms or declines a visit, or a dog on
-- someone's shortlist is reserved, sold, back on sale or cheaper. People read, mark read and clear their own;
-- nobody can write one directly.

create type public.notification_kind as enum ('message', 'visit', 'reserved', 'sold', 'available', 'price');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text not null default '',
  link text not null,
  -- What it's about (a conversation, visit or dog). Repeats about the same thing update the one unread
  -- notification instead of piling up: five store replies are one "New message", with the latest text.
  topic text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create unique index notifications_unread_topic on public.notifications (user_id, topic) where read_at is null and topic is not null;

-- ── Writing them ────────────────────────────────────────────────────────────
create function public.notify(target uuid, k public.notification_kind, t text, b text, l text, about text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, title, body, link, topic) values (target, k, t, left(b, 240), l, about)
  on conflict (user_id, topic) where read_at is null and topic is not null
  do update set kind = excluded.kind, title = excluded.title, body = excluded.body, link = excluded.link, created_at = now();
end;
$$;

-- A store's reply → the buyer
create function public.notify_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  conv record;
begin
  if new.sender_role <> 'store' then return new; end if;
  select c.id, c.buyer_id, s.name as store_name into conv
  from public.conversations c join public.stores s on s.id = c.store_id where c.id = new.conversation_id;
  perform public.notify(conv.buyer_id, 'message', 'New message from ' || conv.store_name, new.body,
    '/account/messages?id=' || conv.id, 'conversation:' || conv.id);
  return new;
end;
$$;
create trigger messages_notify after insert on public.messages for each row execute function public.notify_message();

-- Reading the conversation clears its notification
create function public.clear_conversation_notification()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.buyer_read_at > old.buyer_read_at then
    update public.notifications set read_at = now()
    where user_id = new.buyer_id and topic = 'conversation:' || new.id and read_at is null;
  end if;
  return new;
end;
$$;
create trigger conversations_clear_notification after update of buyer_read_at on public.conversations
  for each row execute function public.clear_conversation_notification();

-- The store confirms or declines a visit, or can no longer make a confirmed one → the buyer
create function public.notify_visit()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  store_name text;
  happening text := to_char(new.day, 'Dy FMDD Mon') || ' at ' || new.slot;
begin
  if new.status = old.status or new.status not in ('confirmed', 'declined') then return new; end if;
  select name into store_name from public.stores where id = new.store_id;
  perform public.notify(new.buyer_id, 'visit',
    case when new.status = 'confirmed' then 'Kennel visit confirmed' else 'Kennel visit declined' end,
    store_name || ', ' || happening || coalesce('. ' || new.store_note, ''),
    '/account/bookings', 'visit:' || new.id);
  return new;
end;
$$;
create trigger visits_notify after update of status on public.visits for each row execute function public.notify_visit();

-- A listed dog is reserved, sold, back on sale or cheaper → everyone who shortlisted it
create function public.notify_dog()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  k public.notification_kind;
  t text;
  b text;
  naira text := '₦' || to_char(new.price_naira, 'FM999,999,999,990');
begin
  if old.status not in ('available', 'reserved') then return new; end if;
  if new.status = 'reserved' and old.status = 'available' then
    k := 'reserved'; t := new.name || ' was reserved'; b := 'Another buyer put down a deposit. ' || new.name || ' stays on your shortlist in case it falls through.';
  elsif new.status = 'sold' then
    k := 'sold'; t := new.name || ' was sold'; b := 'Your shortlist keeps it for reference. Similar dogs are on the Find a guard dog page.';
  elsif new.status = 'available' and old.status = 'reserved' then
    k := 'available'; t := new.name || ' is available again'; b := 'The reservation fell through. ' || new.name || ' is ' || naira || '.';
  elsif new.status = 'available' and new.price_naira < old.price_naira then
    k := 'price'; t := 'Price drop on ' || new.name; b := 'Now ' || naira || ', down from ₦' || to_char(old.price_naira, 'FM999,999,999,990') || '.';
  else
    return new;
  end if;
  perform public.notify(i.user_id, k, t, b, '/dogs/' || lower(new.file_no), 'dog:' || new.id)
  from public.shortlist_items i where i.dog_id = new.id;
  return new;
end;
$$;
create trigger dogs_notify after update of status, price_naira on public.dogs for each row execute function public.notify_dog();

-- ── Access ──────────────────────────────────────────────────────────────────
alter table public.notifications enable row level security;
create policy "Read your own notifications" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "Mark your own notifications read" on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Clear your own notifications" on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke execute on function public.notify(uuid, public.notification_kind, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.notify_message() from public, anon, authenticated;
revoke execute on function public.clear_conversation_notification() from public, anon, authenticated;
revoke execute on function public.notify_visit() from public, anon, authenticated;
revoke execute on function public.notify_dog() from public, anon, authenticated;
