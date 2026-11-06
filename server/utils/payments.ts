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
  const result = data as { outcome: 'held' | 'paid' | 'already' | 'failed' | 'refund', reservationId: string, refundId?: string, amountNaira?: number }
  // The money came in but can't be used (the dog went to someone else, the hold had ended): send it back now
  if (result.outcome === 'refund' && result.refundId) await sendRefund(event, result.refundId, reference, result.amountNaira!)
  return result
}

// Ask Paystack to refund a payment. Paystack confirms later by webhook (refund.processed).
export async function sendRefund(event: H3Event, refundId: string, reference: string, amountNaira: number) {
  const service = serverSupabaseServiceRole<Database>(event)
  try {
    const data = await paystack<{ id?: number | string }>(event, '/refund', { transaction: reference, amount: toKobo(amountNaira) })
    await service.rpc('record_refund', { refund: refundId, to_status: 'sending', provider: data?.id != null ? String(data.id) : null })
  }
  catch (e) {
    await service.rpc('record_refund', { refund: refundId, to_status: 'failed', why: (e as Error).message })
  }
}
