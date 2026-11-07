-- Payments, part 2: stores cancelling (with refunds), payouts to stores' banks, and Dogeash deciding on
-- deposits after a buyer cancels or a hold runs out.
--
-- Money only leaves through the site's server: it claims a refund or payout here (so it's never sent twice),
-- asks Paystack to send it, and records the answer. Paystack's webhook confirms it later.
-- Plain ASCII, so copying can't garble it.

-- -- Stores --
-- The store's reservations, with who the buyer is (name and phone, to arrange the handover)
create function public.store_reservations(target_store uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.has_store_role(target_store, '{owner,manager}') then raise exception 'Owners and managers only' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(x order by x.created_at desc) from (
      select r.id, r.ref, r.dog_name, r.dog_file_no, r.dog_photo_path, r.price_naira, r.deposit_naira, r.commission_naira,
        r.status, r.expires_at, r.deposit_paid_at, r.paid_at, r.completed_at, r.closed_at, r.closed_by, r.close_reason,
        r.money_decision, r.created_at,
        coalesce(nullif(p.full_name, ''), 'A buyer') as buyer_name,
        -- The phone only while there's a handover to arrange
        case when r.status in ('held', 'paid') then p.phone end as buyer_phone,
        (select coalesce(sum(pm.amount_naira), 0) from public.payments pm where pm.reservation_id = r.id and pm.status = 'success') as paid_naira
      from public.reservations r left join public.profiles p on p.id = r.buyer_id
      where r.store_id = target_store and (r.deposit_paid_at is not null or r.status in ('held', 'paid'))
      limit 300
    ) x
  ), '[]'::jsonb);
end;
$$;

-- The store cancels: everything the buyer paid is refunded, and the dog goes back on sale.
-- The site's server then sends the refunds.
create function public.store_cancel_reservation(reservation uuid, reason text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  r public.reservations;
  why text := left(trim(coalesce(reason, '')), 300);
begin
  select * into r from public.reservations where id = reservation for update;
  if r.id is null or not public.has_store_role(r.store_id, '{owner,manager}') then raise exception 'No such reservation' using errcode = 'P0001'; end if;
  if r.status not in ('held', 'paid') then raise exception 'Only a reservation in progress can be cancelled' using errcode = 'P0001'; end if;
  if length(why) < 3 then raise exception 'Say why, for the buyer' using errcode = 'P0001'; end if;

  update public.reservations set status = 'cancelled', closed_at = now(), closed_by = 'store', close_reason = why, money_decision = 'refund' where id = r.id;
  insert into public.refunds (reservation_id, payment_id, amount_naira, reason)
  select r.id, p.id, p.amount_naira, 'Cancelled by the store' from public.payments p where p.reservation_id = r.id and p.status = 'success'
  on conflict (payment_id) do nothing;
  perform public.set_dog_status_for_payment(r.dog_id, 'available');
  perform public.notify(r.buyer_id, 'payment', r.store_name || ' cancelled your reservation',
    'Everything you paid for ' || r.dog_name || ' is being refunded. Their reason: ' || why, '/account/reservations', 'reservation:' || r.id);
end;
$$;

-- -- Dogeash --
-- After a buyer cancelled or a hold ran out: refund the deposit, or release it to the store
-- (less Dogeash's 5%). The site's server then sends the money.
create function public.admin_decide_deposit(reservation uuid, decision text, note text default '')
returns void language plpgsql security definer set search_path = ''
as $$
declare
  r public.reservations;
  paid bigint;
  keep bigint;
begin
  perform public.require_staff('{admin}');
  if decision not in ('refund', 'release') then raise exception 'Refund or release' using errcode = 'P0001'; end if;
  select * into r from public.reservations where id = reservation for update;
  if r.id is null or r.money_decision is distinct from 'waiting' then raise exception 'Nothing waiting on this reservation' using errcode = 'P0001'; end if;
  -- What Dogeash still holds: paid, less anything already refunded (an underpayment, say)
  select coalesce(sum(p.amount_naira), 0) into paid from public.payments p
  where p.reservation_id = r.id and p.status = 'success' and not exists (select 1 from public.refunds f where f.payment_id = p.id);

  update public.reservations set money_decision = decision where id = r.id;
  if decision = 'refund' then
    insert into public.refunds (reservation_id, payment_id, amount_naira, reason)
    select r.id, p.id, p.amount_naira, coalesce(nullif(trim(note), ''), 'Refunded by Dogeash') from public.payments p
    where p.reservation_id = r.id and p.status = 'success'
    on conflict (payment_id) do nothing;
    perform public.notify(r.buyer_id, 'payment', 'Your deposit is being refunded',
      public.naira(paid) || ' for ' || r.dog_name || ' is on its way back to you.', '/account/reservations', 'reservation:' || r.id);
  else
    keep := round(paid * (public.money_rules() ->> 'commissionPercent')::numeric / 100);
    if paid - keep > 0 then
      insert into public.payouts (store_id, reservation_id, amount_naira) values (r.store_id, r.id, paid - keep);
    end if;
    perform public.notify(r.buyer_id, 'payment', 'About your deposit for ' || r.dog_name,
      coalesce(nullif(trim(note), ''), 'Dogeash released the deposit to the store.'), '/account/reservations', 'reservation:' || r.id);
    perform public.notify_store_team(r.store_id, 'Deposit released: ' || r.dog_name,
      public.naira(paid - keep) || ' is due to your bank account.', '/dashboard/payouts', 'reservation:' || r.id);
  end if;
  perform public.admin_log('deposit_' || decision, 'reservation', r.ref, jsonb_build_object('amount', paid, 'note', note));
end;
$$;

-- Everything about money, for the admin console
create function public.admin_money()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_staff('{admin}');
  return jsonb_build_object(
    'reservations', coalesce((select jsonb_agg(x order by x.created_at desc) from (
      select r.id, r.ref, r.dog_name, r.dog_file_no, r.store_name, s.public_id as store_id, r.buyer_id,
        coalesce(nullif(p.full_name, ''), 'A buyer') as buyer_name, u.email as buyer_email,
        r.price_naira, r.deposit_naira, r.status, r.money_decision, r.close_reason, r.closed_by, r.expires_at, r.created_at, r.closed_at,
        (select coalesce(sum(pm.amount_naira), 0) from public.payments pm where pm.reservation_id = r.id and pm.status = 'success') as paid_naira
      from public.reservations r join public.stores s on s.id = r.store_id
      left join public.profiles p on p.id = r.buyer_id left join auth.users u on u.id = r.buyer_id
      where r.deposit_paid_at is not null or r.status in ('held', 'paid')
      order by r.created_at desc limit 300) x), '[]'::jsonb),
    'refunds', coalesce((select jsonb_agg(x order by x.created_at desc) from (
      select f.id, f.amount_naira, f.status, f.reason, f.failure, f.created_at, f.done_at, r.ref, r.dog_name, r.id as reservation_id
      from public.refunds f join public.reservations r on r.id = f.reservation_id order by f.created_at desc limit 200) x), '[]'::jsonb),
    'payouts', coalesce((select jsonb_agg(x order by x.created_at desc) from (
      select o.id, o.amount_naira, o.status, o.failure, o.created_at, o.done_at, r.ref, r.dog_name, s.name as store_name, s.public_id as store_id,
        exists (select 1 from public.store_payout_accounts a where a.store_id = o.store_id) as has_account
      from public.payouts o join public.reservations r on r.id = o.reservation_id join public.stores s on s.id = o.store_id
      order by o.created_at desc limit 200) x), '[]'::jsonb),
    'totals', jsonb_build_object(
      -- Money in Dogeash's hands for sales still in progress or waiting for a decision
      'held', (select coalesce(sum(pm.amount_naira), 0) from public.payments pm join public.reservations r on r.id = pm.reservation_id
        where pm.status = 'success' and (r.status in ('held', 'paid') or r.money_decision = 'waiting')),
      'waiting', (select count(*) from public.reservations where money_decision = 'waiting'),
      'commission', (select coalesce(sum(commission_naira), 0) from public.reservations where status = 'completed'),
      'paidOut', (select coalesce(sum(amount_naira), 0) from public.payouts where status = 'done'),
      'refunded', (select coalesce(sum(amount_naira), 0) from public.refunds where status = 'done'),
      'stuck', (select count(*) from public.payouts where status in ('due', 'failed')) + (select count(*) from public.refunds where status in ('due', 'failed'))
    )
  );
end;
$$;

-- -- The site's server only (service key) --
-- Take a refund for sending: only one sender at a time, and never one that's done
create function public.claim_refund(refund uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  claimed jsonb;
begin
  update public.refunds f set status = 'sending', failure = ''
  where f.id = refund and f.status in ('due', 'failed')
  returning jsonb_build_object('id', f.id, 'amountNaira', f.amount_naira, 'reference', (select reference from public.payments where id = f.payment_id)) into claimed;
  return claimed;
end;
$$;

-- Take a payout for sending: needs the store's bank account; gives it a new transfer reference each try
create function public.claim_payout(payout uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  claimed jsonb;
begin
  update public.payouts o set status = 'sending', failure = '',
    transfer_reference = 'po_' || replace(o.id::text, '-', '') || '_' || extract(epoch from now())::bigint
  from public.store_payout_accounts a
  where o.id = payout and o.status in ('due', 'failed') and a.store_id = o.store_id
  returning jsonb_build_object('id', o.id, 'amountNaira', o.amount_naira, 'recipient', a.recipient_code, 'reference', o.transfer_reference,
    'reason', 'Dogeash payout ' || (select ref from public.reservations where id = o.reservation_id)) into claimed;
  return claimed;
end;
$$;

-- Paystack's answer about a transfer (from the send call, or the webhook by its reference)
create function public.record_transfer(transfer_ref text, to_status public.money_move_status, code text default null, why text default '')
returns void language plpgsql security definer set search_path = ''
as $$
declare
  o public.payouts;
begin
  update public.payouts set status = to_status, transfer_code = coalesce(code, transfer_code), failure = coalesce(why, ''),
    done_at = case when to_status = 'done' then now() else done_at end
  where transfer_reference = transfer_ref and status <> 'done'
  returning * into o;
  if o.id is not null and to_status = 'done' then
    perform public.notify_store_team(o.store_id, 'Payout sent: ' || public.naira(o.amount_naira),
      'It''s on its way to your bank account.', '/dashboard/payouts', 'payout:' || o.id);
  end if;
end;
$$;

-- The refund webhook doesn't say which refund: find it by the payment it refunds
create function public.record_refund_by_payment(payment_reference text, to_status public.money_move_status, provider text default null, why text default '')
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform public.record_refund(f.id, to_status, provider, why)
  from public.refunds f join public.payments p on p.id = f.payment_id where p.reference = payment_reference;
end;
$$;

-- A payout still waiting for the store's bank account: tell the owner once
create function public.notify_payout_waiting()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.store_payout_accounts where store_id = new.store_id) then
    perform public.notify(m.user_id, 'payment', 'Add your bank account to be paid',
      public.naira(new.amount_naira) || ' is waiting for you. Add the account it should go to.', '/dashboard/payouts', 'payout-account:' || new.store_id)
    from public.store_members m where m.store_id = new.store_id and m.role = 'owner';
  end if;
  return new;
end;
$$;
create trigger payouts_notify_waiting after insert on public.payouts for each row execute function public.notify_payout_waiting();

-- -- Permissions --
revoke execute on function public.store_reservations(uuid) from public, anon;
revoke execute on function public.store_cancel_reservation(uuid, text) from public, anon;
revoke execute on function public.admin_decide_deposit(uuid, text, text) from public, anon;
revoke execute on function public.admin_money() from public, anon;
grant execute on function public.store_reservations(uuid) to authenticated;
grant execute on function public.store_cancel_reservation(uuid, text) to authenticated;
grant execute on function public.admin_decide_deposit(uuid, text, text) to authenticated;
grant execute on function public.admin_money() to authenticated;

revoke execute on function public.claim_refund(uuid) from public, anon, authenticated;
revoke execute on function public.claim_payout(uuid) from public, anon, authenticated;
revoke execute on function public.record_transfer(text, public.money_move_status, text, text) from public, anon, authenticated;
revoke execute on function public.record_refund_by_payment(text, public.money_move_status, text, text) from public, anon, authenticated;
revoke execute on function public.notify_payout_waiting() from public, anon, authenticated;
grant execute on function public.claim_refund(uuid) to service_role;
grant execute on function public.claim_payout(uuid) to service_role;
grant execute on function public.record_transfer(text, public.money_move_status, text, text) to service_role;
grant execute on function public.record_refund_by_payment(text, public.money_move_status, text, text) to service_role;
