-- Messages between buyers and stores, and kennel-visit requests.
-- Buyers see only their own; a store's owners and managers handle its messages, and handlers see its visits too.
-- Stores never read buyer profiles: the buyer's name (and phone, for visits) is copied in when they write or book.

create type public.message_role as enum ('buyer', 'store');
create type public.visit_status as enum ('requested', 'confirmed', 'declined', 'cancelled', 'done');
create type public.visit_place as enum ('kennel', 'home');

-- ── Tables ──────────────────────────────────────────────────────────────────
-- One conversation per buyer, store and dog (or per buyer and store when it's not about one dog)
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  buyer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dog_id uuid references public.dogs (id) on delete set null,
  buyer_name text not null default '',
  last_message_at timestamptz not null default now(),
  last_message_preview text not null default '',
  last_sender public.message_role,
  buyer_read_at timestamptz not null default now(),
  store_read_at timestamptz,
  created_at timestamptz not null default now(),
  unique nulls not distinct (store_id, buyer_id, dog_id)
);
create index conversations_buyer_idx on public.conversations (buyer_id, last_message_at desc);
create index conversations_store_idx on public.conversations (store_id, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid default auth.uid() references auth.users (id) on delete set null,
  sender_role public.message_role not null,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  buyer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  buyer_name text not null default '',
  buyer_phone text,
  dog_ids uuid[] not null default '{}',
  service text not null check (length(trim(service)) between 1 and 120),
  day date not null,
  slot text not null check (slot ~ '^[0-9]{1,2}:[0-9]{2}$'),
  place public.visit_place not null default 'kennel',
  note text check (note is null or length(note) <= 1000),
  status public.visit_status not null default 'requested',
  store_note text check (store_note is null or length(store_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index visits_buyer_idx on public.visits (buyer_id, day);
create index visits_store_idx on public.visits (store_id, day);
create trigger visits_updated_at before update on public.visits for each row execute function public.set_updated_at();

-- ── Rules the database enforces ─────────────────────────────────────────────
-- A new conversation or visit: always the signed-in buyer, only with a verified store,
-- only about that store's own dog, and with the buyer's name (and phone) copied in
create function public.prepare_buyer_request()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  profile record;
begin
  new.buyer_id := auth.uid();
  if new.buyer_id is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from public.stores s where s.id = new.store_id and s.status = 'verified') then
    raise exception 'That store isn''t taking messages or visits yet';
  end if;
  select full_name, phone into profile from public.profiles where id = new.buyer_id;
  new.buyer_name := coalesce(profile.full_name, '');
  if tg_table_name = 'conversations' then
    if new.dog_id is not null and not exists (select 1 from public.dogs d where d.id = new.dog_id and d.store_id = new.store_id) then
      raise exception 'That dog isn''t from this store';
    end if;
  else
    new.buyer_phone := profile.phone;
    new.status := 'requested';
    if new.day < current_date then raise exception 'Choose a day from today on'; end if;
    if exists (select 1 from unnest(new.dog_ids) dog where not exists (select 1 from public.dogs d where d.id = dog and d.store_id = new.store_id)) then
      raise exception 'Those dogs aren''t all from this store';
    end if;
  end if;
  return new;
end;
$$;
create trigger conversations_prepare before insert on public.conversations for each row execute function public.prepare_buyer_request();
create trigger visits_prepare before insert on public.visits for each row execute function public.prepare_buyer_request();

-- A new message updates its conversation: preview, time, and the sender has read it
create function public.after_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.conversations set
    last_message_at = new.created_at,
    last_message_preview = left(new.body, 140),
    last_sender = new.sender_role,
    buyer_read_at = case when new.sender_role = 'buyer' then new.created_at else buyer_read_at end,
    store_read_at = case when new.sender_role = 'store' then new.created_at else store_read_at end
  where id = new.conversation_id;
  return new;
end;
$$;
create trigger messages_after_insert after insert on public.messages for each row execute function public.after_message();

-- Visit changes: the buyer may only cancel; the store confirms, declines or marks done (and adds a note)
create function public.check_visit_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  is_store boolean := public.has_store_role(old.store_id, '{owner,manager,handler}');
begin
  if new.status = old.status and new.store_note is not distinct from old.store_note then return new; end if;
  if is_store then
    if new.status not in ('requested', 'confirmed', 'declined', 'done') then raise exception 'Stores can confirm, decline or mark a visit done'; end if;
  elsif old.buyer_id = auth.uid() then
    if new.status <> 'cancelled' or old.status not in ('requested', 'confirmed') or new.store_note is distinct from old.store_note then
      raise exception 'You can only cancel a visit that is requested or confirmed';
    end if;
  else
    raise exception 'Not your visit';
  end if;
  return new;
end;
$$;
create trigger visits_check_change before update on public.visits for each row execute function public.check_visit_change();

-- Mark a conversation read, for whichever side you're on
create function public.mark_conversation_read(target uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  conv record;
begin
  select * into conv from public.conversations where id = target;
  if conv is null then return; end if;
  if conv.buyer_id = auth.uid() then
    update public.conversations set buyer_read_at = now() where id = target;
  elsif public.has_store_role(conv.store_id, '{owner,manager}') then
    update public.conversations set store_read_at = now() where id = target;
  end if;
end;
$$;

revoke execute on function public.prepare_buyer_request() from public, anon, authenticated;
revoke execute on function public.after_message() from public, anon, authenticated;
revoke execute on function public.check_visit_change() from public, anon, authenticated;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- ── Access rules ────────────────────────────────────────────────────────────
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.visits enable row level security;
revoke all on public.conversations, public.messages, public.visits from anon, authenticated;

grant select on public.conversations to authenticated;
grant insert (store_id, dog_id) on public.conversations to authenticated;
create policy "Buyers and the store's people read conversations" on public.conversations for select to authenticated
  using (buyer_id = (select auth.uid()) or public.has_store_role(store_id, '{owner,manager}'));
create policy "Buyers start conversations" on public.conversations for insert to authenticated
  with check (buyer_id = (select auth.uid()));

grant select on public.messages to authenticated;
grant insert (conversation_id, sender_role, body) on public.messages to authenticated;
create policy "Read messages in your conversations" on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id));
create policy "Write as yourself, on your side" on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c where c.id = conversation_id and (
        (sender_role = 'buyer' and c.buyer_id = (select auth.uid()))
        or (sender_role = 'store' and public.has_store_role(c.store_id, '{owner,manager}'))
      )
    )
  );

grant select on public.visits to authenticated;
grant insert (store_id, dog_ids, service, day, slot, place, note) on public.visits to authenticated;
grant update (status, store_note) on public.visits to authenticated;
create policy "Buyers and the store's people read visits" on public.visits for select to authenticated
  using (buyer_id = (select auth.uid()) or public.has_store_role(store_id, '{owner,manager,handler}'));
create policy "Buyers request visits" on public.visits for insert to authenticated
  with check (buyer_id = (select auth.uid()));
create policy "Buyers and the store's people update visits" on public.visits for update to authenticated
  using (buyer_id = (select auth.uid()) or public.has_store_role(store_id, '{owner,manager,handler}'));
