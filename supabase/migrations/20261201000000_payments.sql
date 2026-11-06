-- Payments with Paystack: reserving a dog with a deposit, paying the balance, handover, payouts and refunds.
--
-- The money rules (decided 6 Nov 2026):
--   - the deposit is 10% of the price and holds the dog for 5 days
--   - the balance is paid through Dogeash too; Dogeash holds everything until the buyer confirms the handover
--   - Dogeash keeps 5% of the price, taken from the store's payout
--   - the store cancels: everything paid is refunded
--   - the buyer cancels, or the 5 days run out before the balance is paid: the deposit waits for Dogeash to
--     decide (refund it, or release it to the store)
--
-- Who does what:
--   - the browser never says "paid". The site's server checks every payment with Paystack, then calls
--     record_payment() with the service key. Buyers can't call it.
--   - buyers start, cancel and confirm their own reservations through the functions below
--   - nobody writes these tables directly; everyone can read only their own rows
--
-- Written in plain ASCII (the naira sign is U&'\20A6'), so copying it can't garble it.

alter type public.notification_kind add value if not exists 'payment';

-- -- The rules, in one place --
create function public.money_rules()
returns jsonb language sql immutable set search_path = ''
as $$ select jsonb_build_object('depositPercent', 10, 'holdDays', 5, 'commissionPercent', 5, 'checkoutMinutes', 30) $$;
grant execute on function public.money_rules() to anon, authenticated;

-- "N1,250,000" with the naira sign, for notification texts
create function public.naira(amount bigint)
returns text language sql immutable set search_path = ''
as $$ select U&'\20A6' || to_char(amount, 'FM999,999,999,990') $$;

-- -- Tables --
-- pending: checkout started, deposit not paid yet (holds the dog for 30 minutes so two buyers can't pay at once)
-- held: deposit paid, the dog is reserved for 5 days
-- paid: balance paid too, waiting for the handover
-- completed: the buyer confirmed the handover; the store's payout is due
-- cancelled / expired: ended early; see money_decision
create type public.reservation_status as enum ('pending', 'held', 'paid', 'completed', 'cancelled', 'expired');
create type public.payment_status as enum ('pending', 'success', 'failed');
create type public.money_move_status as enum ('due', 'sending', 'done', 'failed');

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('RSV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  dog_id uuid not null references public.dogs (id) on delete restrict,
  store_id uuid not null references public.stores (id) on delete restrict,
  buyer_id uuid not null references auth.users (id) on delete restrict,
  -- What it was about, kept as it was then (the dog may later be sold or withdrawn and hidden from buyers)
  dog_name text not null,
  dog_file_no text not null,
  dog_photo_path text,
  store_name text not null,
  -- The figures, fixed when the reservation starts (a later price change doesn't touch them)
  price_naira bigint not null check (price_naira > 0),
  deposit_naira bigint not null check (deposit_naira > 0),
  commission_naira bigint not null check (commission_naira >= 0),
  status public.reservation_status not null default 'pending',
  expires_at timestamptz not null,
  deposit_paid_at timestamptz,
  paid_at timestamptz,
  completed_at timestamptz,
  closed_at timestamptz,
  closed_by text check (closed_by in ('buyer', 'store', 'dogeash', 'system')),
  close_reason text not null default '',
  -- After a cancellation or expiry with money held: 'waiting' for Dogeash, then 'refund' or 'release'
  money_decision text check (money_decision in ('waiting', 'refund', 'release')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reservations_buyer_idx on public.reservations (buyer_id, created_at desc);
create index reservations_store_idx on public.reservations (store_id, created_at desc);
create index reservations_dog_idx on public.reservations (dog_id) where status in ('pending', 'held', 'paid');
create trigger reservations_updated_at before update on public.reservations for each row execute function public.set_updated_at();

-- Each attempt to pay: one row per Paystack reference
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete restrict,
  buyer_id uuid not null references auth.users (id) on delete restrict,
  kind text not null check (kind in ('deposit', 'balance')),
  reference text not null unique,
  amount_naira bigint not null check (amount_naira > 0),
  status public.payment_status not null default 'pending',
  channel text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index payments_reservation_idx on public.payments (reservation_id);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete restrict,
  payment_id uuid not null references public.payments (id) on delete restrict,
  amount_naira bigint not null check (amount_naira > 0),
  reason text not null default '',
  status public.money_move_status not null default 'due',
  provider_id text,
  failure text not null default '',
  created_at timestamptz not null default now(),
  done_at timestamptz,
  unique (payment_id)
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  reservation_id uuid not null unique references public.reservations (id) on delete restrict,
  amount_naira bigint not null check (amount_naira > 0),
  status public.money_move_status not null default 'due',
  transfer_reference text unique,
  transfer_code text,
  failure text not null default '',
  created_at timestamptz not null default now(),
  done_at timestamptz
);
create index payouts_store_idx on public.payouts (store_id, created_at desc);

-- Where a store is paid. The full account number goes to Paystack (which checks the name with the bank)
-- and only its last four digits are kept here.
create table public.store_payout_accounts (
  store_id uuid primary key references public.stores (id) on delete cascade,
  bank_code text not null,
  bank_name text not null,
  account_name text not null,
  account_last4 text not null check (account_last4 ~ '^[0-9]{4}$'),
  recipient_code text not null,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- -- Access: read your own, write through the functions only --
alter table public.reservations enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.payouts enable row level security;
alter table public.store_payout_accounts enable row level security;
revoke all on public.reservations, public.payments, public.refunds, public.payouts, public.store_payout_accounts from anon, authenticated;
grant select on public.reservations, public.payments, public.refunds, public.payouts, public.store_payout_accounts to authenticated;

create policy "Buyers read their reservations" on public.reservations for select to authenticated using (buyer_id = (select auth.uid()));
create policy "Owners and managers read their store's reservations" on public.reservations for select to authenticated using (public.has_store_role(store_id, '{owner,manager}'));
create policy "Staff read reservations" on public.reservations for select to authenticated using (public.is_staff('{admin}'));

create policy "Buyers read their payments" on public.payments for select to authenticated using (buyer_id = (select auth.uid()));
create policy "Staff read payments" on public.payments for select to authenticated using (public.is_staff('{admin}'));

create policy "Buyers read their refunds" on public.refunds for select to authenticated
  using (exists (select 1 from public.reservations r where r.id = reservation_id and r.buyer_id = (select auth.uid())));
create policy "Staff read refunds" on public.refunds for select to authenticated using (public.is_staff('{admin}'));

create policy "Owners read their store's payouts" on public.payouts for select to authenticated using (public.has_store_role(store_id, '{owner}'));
create policy "Staff read payouts" on public.payouts for select to authenticated using (public.is_staff('{admin}'));

create policy "Owners read their payout account" on public.store_payout_accounts for select to authenticated using (public.has_store_role(store_id, '{owner}'));
create policy "Staff read payout accounts" on public.store_payout_accounts for select to authenticated using (public.is_staff('{admin}'));

-- -- Helpers --
-- Tell the store's owners and managers
create function public.notify_store_team(target_store uuid, t text, b text, l text, about text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform public.notify(m.user_id, 'payment', t, b, l, about)
  from public.store_members m where m.store_id = target_store and m.role in ('owner', 'manager');
end;
$$;

-- Change a dog's status from here (the guard below lets only this through while money is held)
create function public.set_dog_status_for_payment(target_dog uuid, to_status public.dog_status)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform set_config('dogeash.payment_change', 'on', true);
  update public.dogs set status = to_status where id = target_dog;
  perform set_config('dogeash.payment_change', 'off', true);
end;
$$;

-- While a buyer has paid for a dog, the store can't put it back on sale, sell it or withdraw it from the
-- dashboard: the reservation decides (and Dogeash, for disputes)
create function public.guard_paid_dog()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if current_setting('dogeash.payment_change', true) = 'on' or auth.uid() is null or public.is_staff('{admin}') then return new; end if;
  if exists (select 1 from public.reservations r where r.dog_id = new.id and r.status in ('held', 'paid')) then
    raise exception 'A buyer has paid a deposit on this dog. It stays reserved until the reservation ends.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger dogs_guard_paid before update of status on public.dogs for each row execute function public.guard_paid_dog();

-- Holds that ran out: an unpaid checkout after 30 minutes; a deposit after 5 days with the balance unpaid.
-- Runs every 15 minutes (pg_cron, below) and before anything that depends on it.
create function public.expire_reservations()
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  n integer := 0;
begin
  update public.reservations set status = 'expired', closed_at = now(), closed_by = 'system', close_reason = 'Checkout not finished'
  where status = 'pending' and expires_at < now();

  for r in select * from public.reservations where status = 'held' and expires_at < now() for update loop
    update public.reservations set status = 'expired', closed_at = now(), closed_by = 'system',
      close_reason = 'The balance wasn''t paid within the hold', money_decision = 'waiting'
    where id = r.id;
    perform public.set_dog_status_for_payment(r.dog_id, 'available');
    perform public.notify(r.buyer_id, 'payment', 'Reservation ended: ' || r.dog_name,
      'The hold ran out before the balance was paid. Dogeash will contact you about your deposit.', '/account/reservations', 'reservation:' || r.id);
    perform public.notify_store_team(r.store_id, 'Reservation ended: ' || r.dog_name,
      r.dog_name || ' is back on sale. Dogeash decides what happens to the deposit.', '/dashboard/payouts', 'reservation:' || r.id);
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- -- Buyers --
-- Start reserving a dog: returns what the site's server needs to open Paystack's checkout.
-- Coming back to an unfinished checkout for the same dog reuses the reservation with a new payment reference.
create function public.start_reservation(file_no text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  d record;
  r public.reservations;
  rules jsonb := public.money_rules();
  ref text := 'DGX-' || upper(replace(gen_random_uuid()::text, '-', ''));
begin
  if me is null then raise exception 'Sign in to reserve a dog' using errcode = '42501'; end if;
  if public.is_blocked() then raise exception 'Your account can''t make reservations right now' using errcode = '42501'; end if;
  perform public.expire_reservations();

  select dg.*, s.name as store_name, s.status as store_status into d
  from public.dogs dg join public.stores s on s.id = dg.store_id where dg.file_no = upper(start_reservation.file_no) for update of dg;
  if d.id is null or d.store_status <> 'verified' then raise exception 'That dog isn''t listed' using errcode = 'P0001'; end if;
  if public.has_store_role(d.store_id, '{owner,manager,handler}') then raise exception 'You can''t reserve your own store''s dog' using errcode = 'P0001'; end if;

  select * into r from public.reservations where dog_id = d.id and buyer_id = me and status = 'pending';
  if r.id is null then
    if d.status <> 'available' then raise exception 'This dog is already reserved' using errcode = 'P0001'; end if;
    if exists (select 1 from public.reservations where dog_id = d.id and status in ('pending', 'held', 'paid')) then
      raise exception 'Someone is paying for this dog right now. Try again in half an hour.' using errcode = 'P0001';
    end if;
    insert into public.reservations (dog_id, store_id, buyer_id, dog_name, dog_file_no, dog_photo_path, store_name,
      price_naira, deposit_naira, commission_naira, expires_at)
    values (d.id, d.store_id, me, d.name, d.file_no, d.photo_path, d.store_name, d.price_naira,
      ceil(d.price_naira * (rules ->> 'depositPercent')::numeric / 100),
      round(d.price_naira * (rules ->> 'commissionPercent')::numeric / 100),
      now() + make_interval(mins => (rules ->> 'checkoutMinutes')::int))
    returning * into r;
  else
    update public.reservations set expires_at = now() + make_interval(mins => (rules ->> 'checkoutMinutes')::int)
    where id = r.id returning * into r;
  end if;

  insert into public.payments (reservation_id, buyer_id, kind, reference, amount_naira) values (r.id, me, 'deposit', ref, r.deposit_naira);
  return jsonb_build_object('reservationId', r.id, 'ref', r.ref, 'reference', ref, 'amountNaira', r.deposit_naira,
    'email', (select email from auth.users where id = me), 'kind', 'deposit', 'dogName', r.dog_name);
end;
$$;

-- Pay the rest of the price, while the deposit still holds the dog
create function public.start_balance_payment(reservation uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  r public.reservations;
  ref text := 'DGX-' || upper(replace(gen_random_uuid()::text, '-', ''));
begin
  if me is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  perform public.expire_reservations();
  select * into r from public.reservations where id = reservation and buyer_id = me;
  if r.id is null then raise exception 'No such reservation' using errcode = 'P0001'; end if;
  if r.status <> 'held' then raise exception 'There''s no balance to pay on this reservation' using errcode = 'P0001'; end if;
  insert into public.payments (reservation_id, buyer_id, kind, reference, amount_naira)
  values (r.id, me, 'balance', ref, r.price_naira - r.deposit_naira);
  return jsonb_build_object('reservationId', r.id, 'ref', r.ref, 'reference', ref, 'amountNaira', r.price_naira - r.deposit_naira,
    'email', (select email from auth.users where id = me), 'kind', 'balance', 'dogName', r.dog_name);
end;
$$;

-- Cancel. Before paying: nothing to settle. After the deposit: the dog goes back on sale and the deposit
-- waits for Dogeash. Once paid in full, cancelling goes through Dogeash (a dispute), not this button.
create function public.cancel_reservation(reservation uuid, reason text default '')
returns void language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  r public.reservations;
begin
  select * into r from public.reservations where id = reservation and buyer_id = me for update;
  if r.id is null then raise exception 'No such reservation' using errcode = 'P0001'; end if;
  if r.status = 'pending' then
    update public.reservations set status = 'cancelled', closed_at = now(), closed_by = 'buyer', close_reason = left(trim(coalesce(reason, '')), 300) where id = r.id;
  elsif r.status = 'held' then
    update public.reservations set status = 'cancelled', closed_at = now(), closed_by = 'buyer',
      close_reason = left(trim(coalesce(reason, '')), 300), money_decision = 'waiting' where id = r.id;
    perform public.set_dog_status_for_payment(r.dog_id, 'available');
    perform public.notify_store_team(r.store_id, 'Reservation cancelled: ' || r.dog_name,
      'The buyer cancelled. ' || r.dog_name || ' is back on sale; Dogeash decides what happens to the deposit.', '/dashboard/payouts', 'reservation:' || r.id);
  else
    raise exception 'This reservation can''t be cancelled here. Contact Dogeash.' using errcode = 'P0001';
  end if;
end;
$$;

-- The buyer has the dog: the sale is done, the dog is marked sold and the store's payout is due
create function public.confirm_handover(reservation uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  r public.reservations;
begin
  select * into r from public.reservations where id = reservation and buyer_id = me for update;
  if r.id is null then raise exception 'No such reservation' using errcode = 'P0001'; end if;
  if r.status <> 'paid' then raise exception 'Confirm the handover once the balance is paid' using errcode = 'P0001'; end if;
  update public.reservations set status = 'completed', completed_at = now() where id = r.id;
  perform public.set_dog_status_for_payment(r.dog_id, 'sold');
  insert into public.payouts (store_id, reservation_id, amount_naira) values (r.store_id, r.id, r.price_naira - r.commission_naira);
  perform public.notify_store_team(r.store_id, 'Handover confirmed: ' || r.dog_name,
    public.naira(r.price_naira - r.commission_naira) || ' is due to your bank account (the price less Dogeash''s 5%).', '/dashboard/payouts', 'reservation:' || r.id);
end;
$$;

-- -- The site's server only (service key) --
-- Paystack said a payment went through (or failed). Safe to call twice: a payment is only settled once.
-- Returns what happened, and a refund to send when the money arrived for a reservation that had already
-- ended or a dog someone else had paid for.
create function public.record_payment(payment_reference text, amount_paid_naira bigint, succeeded boolean, pay_channel text default '')
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  p public.payments;
  r public.reservations;
  refund_id uuid;
  refund_why text;
begin
  select * into p from public.payments where reference = payment_reference for update;
  if p.id is null then raise exception 'Unknown payment reference' using errcode = 'P0001'; end if;
  if p.status = 'success' then return jsonb_build_object('outcome', 'already', 'reservationId', p.reservation_id); end if;
  if not succeeded then
    update public.payments set status = 'failed' where id = p.id;
    return jsonb_build_object('outcome', 'failed', 'reservationId', p.reservation_id);
  end if;

  update public.payments set status = 'success', paid_at = now(), channel = left(coalesce(pay_channel, ''), 40) where id = p.id;
  select * into r from public.reservations where id = p.reservation_id for update;

  if amount_paid_naira < p.amount_naira then
    refund_why := 'Paid less than the amount due';
  elsif p.kind = 'deposit' and r.status in ('pending', 'expired', 'cancelled') and r.deposit_paid_at is null and (
    -- A late payment on a lapsed checkout still counts if nobody else took the dog meanwhile
    exists (select 1 from public.dogs where id = r.dog_id and status = 'available')
    and not exists (select 1 from public.reservations o where o.dog_id = r.dog_id and o.id <> r.id and o.status in ('held', 'paid'))
  ) then
    update public.reservations set status = 'held', deposit_paid_at = now(), closed_at = null, closed_by = null, close_reason = '',
      expires_at = now() + make_interval(days => (public.money_rules() ->> 'holdDays')::int)
    where id = r.id returning * into r;
    perform public.set_dog_status_for_payment(r.dog_id, 'reserved');
    perform public.notify(r.buyer_id, 'payment', r.dog_name || ' is reserved for you',
      'Deposit of ' || public.naira(r.deposit_naira) || ' received. Pay the balance within 5 days.', '/account/reservations', 'reservation:' || r.id);
    perform public.notify_store_team(r.store_id, 'Deposit paid: ' || r.dog_name,
      public.naira(r.deposit_naira) || ' deposit, held by Dogeash. ' || r.dog_name || ' is reserved for 5 days.', '/dashboard/payouts', 'reservation:' || r.id);
    return jsonb_build_object('outcome', 'held', 'reservationId', r.id);
  elsif p.kind = 'deposit' then
    refund_why := 'The dog was no longer available';
  elsif p.kind = 'balance' and r.status = 'held' then
    update public.reservations set status = 'paid', paid_at = now() where id = r.id returning * into r;
    perform public.notify(r.buyer_id, 'payment', 'Paid in full: ' || r.dog_name,
      'Dogeash holds the money until you confirm the handover.', '/account/reservations', 'reservation:' || r.id);
    perform public.notify_store_team(r.store_id, 'Paid in full: ' || r.dog_name,
      'Arrange the handover. You''re paid once the buyer confirms it.', '/dashboard/payouts', 'reservation:' || r.id);
    return jsonb_build_object('outcome', 'paid', 'reservationId', r.id);
  else
    refund_why := 'The reservation had already ended';
  end if;

  insert into public.refunds (reservation_id, payment_id, amount_naira, reason) values (r.id, p.id, amount_paid_naira, refund_why)
  on conflict (payment_id) do nothing returning id into refund_id;
  return jsonb_build_object('outcome', 'refund', 'reservationId', r.id, 'refundId', refund_id, 'reference', p.reference, 'amountNaira', amount_paid_naira);
end;
$$;

-- A refund or payout's progress, from Paystack's answers and webhooks
create function public.record_refund(refund uuid, to_status public.money_move_status, provider text default null, why text default '')
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.refunds set status = to_status, provider_id = coalesce(provider, provider_id), failure = coalesce(why, ''),
    done_at = case when to_status = 'done' then now() else done_at end
  where id = refund and status <> 'done';
end;
$$;

-- -- Permissions --
revoke execute on function public.naira(bigint) from public, anon, authenticated;
revoke execute on function public.notify_store_team(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.set_dog_status_for_payment(uuid, public.dog_status) from public, anon, authenticated;
revoke execute on function public.guard_paid_dog() from public, anon, authenticated;
revoke execute on function public.expire_reservations() from public, anon, authenticated;
revoke execute on function public.record_payment(text, bigint, boolean, text) from public, anon, authenticated;
revoke execute on function public.record_refund(uuid, public.money_move_status, text, text) from public, anon, authenticated;
grant execute on function public.expire_reservations() to service_role;
grant execute on function public.record_payment(text, bigint, boolean, text) to service_role;
grant execute on function public.record_refund(uuid, public.money_move_status, text, text) to service_role;

revoke execute on function public.start_reservation(text) from public, anon;
revoke execute on function public.start_balance_payment(uuid) from public, anon;
revoke execute on function public.cancel_reservation(uuid, text) from public, anon;
revoke execute on function public.confirm_handover(uuid) from public, anon;
grant execute on function public.start_reservation(text) to authenticated;
grant execute on function public.start_balance_payment(uuid) to authenticated;
grant execute on function public.cancel_reservation(uuid, text) to authenticated;
grant execute on function public.confirm_handover(uuid) to authenticated;

-- -- Every 15 minutes: end holds that ran out --
-- Needs the pg_cron extension (Supabase: Database -> Extensions -> pg_cron). Without it, holds still end
-- whenever someone starts a reservation or pays, just not on the dot.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('dogeash-expire-reservations', '*/15 * * * *', 'select public.expire_reservations()');
  end if;
end;
$$;
