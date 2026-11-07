import { defineEventHandler, getHeader, readRawBody, setResponseStatus } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { validSignature } from '../../utils/paystack'
import { settlePayment } from '../../utils/payments'

// Paystack tells the server what happened, even if the buyer closed the tab before coming back.
// Set this address in Paystack: Settings -> API Keys & Webhooks -> Webhook URL = https://<your site>/api/paystack/webhook
// Every message is checked against the secret key's signature; anything unsigned is ignored.
export default defineEventHandler(async (event) => {
  const raw = (await readRawBody(event, 'utf8')) ?? ''
  if (!validSignature(event, raw, getHeader(event, 'x-paystack-signature'))) {
    setResponseStatus(event, 401)
    return { ok: false }
  }
  const { event: kind, data } = JSON.parse(raw) as { event: string, data: Record<string, any> }

  if (kind === 'charge.success' && data?.reference) {
    // Checked again with Paystack's API rather than trusting the message's figures
    await settlePayment(event, String(data.reference)).catch(() => null)
  }
  else if ((kind === 'refund.processed' || kind === 'refund.failed') && data?.transaction_reference) {
    await serverSupabaseServiceRole<Database>(event).rpc('record_refund_by_payment', {
      payment_reference: String(data.transaction_reference),
      to_status: kind === 'refund.processed' ? 'done' : 'failed',
      provider: data.id != null ? String(data.id) : null,
      why: kind === 'refund.failed' ? 'Paystack couldn\'t refund it' : '',
    })
  }
  else if (kind?.startsWith('transfer.') && data?.reference) {
    // A payout to a store: transfer.success, transfer.failed or transfer.reversed
    await serverSupabaseServiceRole<Database>(event).rpc('record_transfer', {
      transfer_ref: String(data.reference),
      to_status: kind === 'transfer.success' ? 'done' : 'failed',
      code: data.transfer_code ? String(data.transfer_code) : null,
      why: kind === 'transfer.success' ? '' : `Paystack: ${kind.replace('transfer.', '')}`,
    })
  }
  // Paystack retries anything that isn't a 200, so everything else is acknowledged
  return { ok: true }
})
