import type { H3Event } from 'h3'
import { createError, getRequestURL } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { paystack, toKobo, toNaira } from './paystack'

// What start_reservation / start_balance_payment return: enough to open Paystack's checkout
export interface CheckoutStart {
  reservationId: string
  ref: string
  reference: string
  amountNaira: number
  email: string
  kind: 'deposit' | 'balance'
  dogName: string
}

// A database refusal, as the message the buyer should read
export function refused(error: { message: string, code?: string }) {
  const status = error.code === '42501' ? 403 : 400
  return createError({ statusCode: status, statusMessage: error.message })
}

// Open Paystack's hosted checkout for a payment the database has just created. Paystack sends the buyer
// back to their Reservations page with ?reference=…, where the page asks the server to check it.
export async function openCheckout(event: H3Event, start: CheckoutStart) {
  const origin = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
  const back = `${origin}/account/reservations`
  const data = await paystack<{ authorization_url: string }>(event, '/transaction/initialize', {
    email: start.email,
    amount: toKobo(start.amountNaira),
    currency: 'NGN',
    reference: start.reference,
    callback_url: back,
    metadata: {
      reservation_id: start.reservationId,
      reservation_ref: start.ref,
      kind: start.kind,
      // Paystack's "Cancel payment" link
      cancel_action: `${back}?cancelled=${encodeURIComponent(start.reference)}`,
      custom_fields: [
        { display_name: 'Reservation', variable_name: 'reservation', value: start.ref },
        { display_name: 'For', variable_name: 'for', value: `${start.dogName} (${start.kind})` },
      ],
    },
  })
  return { url: data.authorization_url }
}

// Ask Paystack what happened to a payment, and record it. Safe to repeat: the database settles a payment once.
// Used by the page the buyer comes back to and by the webhook, whichever is first.
export async function settlePayment(event: H3Event, reference: string) {
  const tx = await paystack<{ status: string, amount: number, currency: string, channel: string }>(event, `/transaction/verify/${encodeURIComponent(reference)}`)
  if (['ongoing', 'pending', 'processing', 'queued'].includes(tx.status)) return { outcome: 'waiting' as const }

  const service = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await service.rpc('record_payment', {
    payment_reference: reference,
    amount_paid_naira: tx.currency === 'NGN' ? toNaira(tx.amount) : 0,
    succeeded: tx.status === 'success' && tx.currency === 'NGN',
    pay_channel: tx.channel ?? '',
  })
  if (error) throw refused(error)
  const result = data as { outcome: 'held' | 'paid' | 'already' | 'failed' | 'refund', reservationId: string }
  // The money came in but can't be used (the dog went to someone else, the hold had ended): send it back now
  if (result.outcome === 'refund') await sendDueMoney(event, result.reservationId)
  return result
}

// Send every refund and payout waiting on a reservation (after a refund-worthy payment, a store's
// cancellation, a handover, or Dogeash's decision on a deposit). Failures stay recorded for a retry.
export async function sendDueMoney(event: H3Event, reservationId: string) {
  const service = serverSupabaseServiceRole<Database>(event)
  const [{ data: refunds }, { data: payouts }] = await Promise.all([
    service.from('refunds').select('id').eq('reservation_id', reservationId).in('status', ['due']),
    service.from('payouts').select('id').eq('reservation_id', reservationId).in('status', ['due']),
  ])
  for (const f of refunds ?? []) await sendRefund(event, f.id)
  for (const o of payouts ?? []) await sendPayout(event, o.id)
}

// Ask Paystack to refund a payment. Claimed first, so it's never sent twice; Paystack confirms later by webhook.
export async function sendRefund(event: H3Event, refundId: string) {
  const service = serverSupabaseServiceRole<Database>(event)
  const { data } = await service.rpc('claim_refund', { refund: refundId })
  const claim = data as { id: string, amountNaira: number, reference: string } | null
  if (!claim) return
  try {
    const res = await paystack<{ id?: number | string }>(event, '/refund', { transaction: claim.reference, amount: toKobo(claim.amountNaira) })
    await service.rpc('record_refund', { refund: claim.id, to_status: 'sending', provider: res?.id != null ? String(res.id) : null })
  }
  catch (e) {
    await service.rpc('record_refund', { refund: claim.id, to_status: 'failed', why: (e as Error).message })
  }
}

// Pay a store with a Paystack transfer to its saved bank account. Waits (stays due) until the store has one.
export async function sendPayout(event: H3Event, payoutId: string) {
  const service = serverSupabaseServiceRole<Database>(event)
  const { data } = await service.rpc('claim_payout', { payout: payoutId })
  const claim = data as { id: string, amountNaira: number, recipient: string, reference: string, reason: string } | null
  if (!claim) return
  try {
    const res = await paystack<{ status: string, transfer_code: string }>(event, '/transfer', {
      source: 'balance', amount: toKobo(claim.amountNaira), recipient: claim.recipient, reference: claim.reference, reason: claim.reason,
    })
    if (res.status === 'otp') {
      await service.rpc('record_transfer', { transfer_ref: claim.reference, to_status: 'failed', code: res.transfer_code, why: 'Paystack asked for an OTP. Turn off "Confirm transfers with OTP" in Paystack\'s settings, then retry.' })
    }
    else if (res.status === 'success') {
      await service.rpc('record_transfer', { transfer_ref: claim.reference, to_status: 'done', code: res.transfer_code })
    }
    else if (res.status === 'failed' || res.status === 'reversed') {
      await service.rpc('record_transfer', { transfer_ref: claim.reference, to_status: 'failed', code: res.transfer_code, why: `Paystack: ${res.status}` })
    }
    else {
      // pending: the webhook says how it ended
      await service.rpc('record_transfer', { transfer_ref: claim.reference, to_status: 'sending', code: res.transfer_code })
    }
  }
  catch (e) {
    await service.rpc('record_transfer', { transfer_ref: claim.reference, to_status: 'failed', why: (e as Error).message })
  }
}

// Send every payout a store has waiting (after it adds or changes its bank account)
export async function sendStorePayouts(event: H3Event, storeId: string) {
  const service = serverSupabaseServiceRole<Database>(event)
  const { data } = await service.from('payouts').select('id').eq('store_id', storeId).in('status', ['due', 'failed'])
  for (const o of data ?? []) await sendPayout(event, o.id)
}

// Catch up with Paystack on refunds and payouts still marked "sending": normally the webhook settles them,
// but it can't reach a laptop in development, and a webhook can be missed. Asks Paystack directly.
export async function syncSendingMoney(event: H3Event) {
  const service = serverSupabaseServiceRole<Database>(event)
  const [{ data: refunds }, { data: payouts }] = await Promise.all([
    service.from('refunds').select('id, provider_id').eq('status', 'sending').not('provider_id', 'is', null).limit(50),
    service.from('payouts').select('transfer_reference').eq('status', 'sending').not('transfer_reference', 'is', null).limit(50),
  ])
  let settled = 0
  for (const f of refunds ?? []) {
    const r = await paystack<{ status: string }>(event, `/refund/${encodeURIComponent(f.provider_id!)}`).catch(() => null)
    if (r?.status === 'processed') await service.rpc('record_refund', { refund: f.id, to_status: 'done' })
    else if (r?.status === 'failed' || r?.status === 'reversed') await service.rpc('record_refund', { refund: f.id, to_status: 'failed', why: `Paystack: ${r.status}` })
    else continue
    settled++
  }
  for (const o of payouts ?? []) {
    const t = await paystack<{ status: string, transfer_code: string }>(event, `/transfer/verify/${encodeURIComponent(o.transfer_reference!)}`).catch(() => null)
    if (t?.status === 'success') await service.rpc('record_transfer', { transfer_ref: o.transfer_reference!, to_status: 'done', code: t.transfer_code })
    else if (t?.status === 'failed' || t?.status === 'reversed') await service.rpc('record_transfer', { transfer_ref: o.transfer_reference!, to_status: 'failed', code: t.transfer_code, why: `Paystack: ${t.status}` })
    else continue
    settled++
  }
  return { settled }
}
