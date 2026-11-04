-- Store teams. Owners invite people by email with a role; the invitation waits in that person's account
-- (with a bell notification if they already have one) until they join or decline. Everyone on the team sees
-- who else is on it; only owners see their emails. Roles, removal and leaving use the store_members rules
-- from the first migration (owners change roles and remove people; anyone can leave; one owner always stays).

alter type public.notification_kind add value if not exists 'team';

create table public.store_invites (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  email text not null check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role public.store_role not null,
  invited_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (store_id, email)
);
create index store_invites_email_idx on public.store_invites (email);

-- The signed-in person's own email, for matching invitations to them
create function public.my_email()
returns text language sql stable security definer set search_path = ''
as $$ select lower(email) from auth.users where id = (select auth.uid()) $$;

-- A new invitation: lower-case email, from the signed-in owner, not someone already on the team, 20 waiting at most
create function public.prepare_store_invite()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.email := lower(trim(new.email));
  new.invited_by := auth.uid();
  if exists (
    select 1 from public.store_members m join auth.users u on u.id = m.user_id
    where m.store_id = new.store_id and lower(u.email) = new.email
  ) then
    raise exception 'That person is already on the team';
  end if;
  if (select count(*) from public.store_invites where store_id = new.store_id) >= 20 then
    raise exception 'A store can have 20 invitations waiting. Withdraw some first';
  end if;
  return new;
end;
$$;
create trigger store_invites_prepare before insert on public.store_invites for each row execute function public.prepare_store_invite();

-- Someone with an account already gets a bell notification
create function public.notify_store_invite()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  invitee uuid;
  store_name text;
  inviter text;
begin
  select id into invitee from auth.users where lower(email) = new.email;
  if invitee is null then return new; end if;
  select name into store_name from public.stores where id = new.store_id;
  select coalesce(nullif(full_name, ''), 'The owner') into inviter from public.profiles where id = new.invited_by;
  perform public.notify(invitee, 'team', 'Join ' || store_name || ' on Dogeash',
    coalesce(inviter, 'The owner') || ' invited you as a ' || new.role || '. Join or decline from your account.',
    '/account', 'invite:' || new.id);
  return new;
end;
$$;
create trigger store_invites_notify after insert on public.store_invites for each row execute function public.notify_store_invite();

-- ── For the person invited ──────────────────────────────────────────────────
-- Invitations waiting for me, with the store's name (the store may still be a draft I can't otherwise read)
create function public.my_store_invites()
returns table (id uuid, store_name text, store_city text, role public.store_role, invited_by_name text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select i.id, s.name, s.city, i.role, coalesce(p.full_name, ''), i.created_at
  from public.store_invites i
  join public.stores s on s.id = i.store_id
  left join public.profiles p on p.id = i.invited_by
  where i.email = public.my_email()
  order by i.created_at desc
$$;

-- Join: become a member with the invited role. Returns the store's public id.
create function public.accept_store_invite(target uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  inv record;
begin
  select * into inv from public.store_invites where id = target and email = public.my_email();
  if inv is null then raise exception 'This invitation isn''t for you, or it was withdrawn'; end if;
  insert into public.store_members (store_id, user_id, role) values (inv.store_id, auth.uid(), inv.role)
    on conflict (store_id, user_id) do nothing;
  delete from public.store_invites where id = target;
  update public.notifications set read_at = now() where user_id = auth.uid() and topic = 'invite:' || target and read_at is null;
  return (select public_id from public.stores where id = inv.store_id);
end;
$$;

-- ── For the team ────────────────────────────────────────────────────────────
-- Everyone on the store's team, owners first. Emails only for owners. Empty for anyone not on the team.
create function public.store_team(target uuid)
returns table (user_id uuid, name text, email text, role public.store_role, joined_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select m.user_id, coalesce(p.full_name, ''),
    case when public.has_store_role(target, '{owner}') then u.email end,
    m.role, m.created_at
  from public.store_members m
  left join public.profiles p on p.id = m.user_id
  left join auth.users u on u.id = m.user_id
  where m.store_id = target and public.has_store_role(target, '{owner,manager,handler}')
  order by m.role, m.created_at
$$;

-- ── Access ──────────────────────────────────────────────────────────────────
alter table public.store_invites enable row level security;
create policy "Owners and the invited person see an invitation" on public.store_invites for select to authenticated
  using (public.has_store_role(store_id, '{owner}') or email = public.my_email());
create policy "Owners invite" on public.store_invites for insert to authenticated
  with check (public.has_store_role(store_id, '{owner}'));
create policy "Owners withdraw, the invited person declines" on public.store_invites for delete to authenticated
  using (public.has_store_role(store_id, '{owner}') or email = public.my_email());

revoke all on public.store_invites from anon, authenticated;
grant select, delete on public.store_invites to authenticated;
grant insert (store_id, email, role) on public.store_invites to authenticated;

revoke execute on function public.prepare_store_invite() from public, anon, authenticated;
revoke execute on function public.notify_store_invite() from public, anon, authenticated;
revoke execute on function public.my_email() from public, anon;
revoke execute on function public.my_store_invites() from public, anon;
revoke execute on function public.accept_store_invite(uuid) from public, anon;
revoke execute on function public.store_team(uuid) from public, anon;
grant execute on function public.my_email() to authenticated;
grant execute on function public.my_store_invites() to authenticated;
grant execute on function public.accept_store_invite(uuid) to authenticated;
grant execute on function public.store_team(uuid) to authenticated;
