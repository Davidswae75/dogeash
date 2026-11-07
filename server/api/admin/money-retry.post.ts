import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { sendPayout, sendRefund } from '../../utils/payments'

// Admin: try a failed refund or payout again (after fixing what Paystack complained about)
export default defineEventHandler(async (event) => {
  const { kind, id } = await readBody<{ kind?: string, id?: string }>(event)
  if (!id || (kind !== 'refund' && kind !== 'payout')) throw createError({ statusCode: 400, statusMessage: 'Retry which refund or payout?' })
  const client = await serverSupabaseClient<Database>(event)
  const { data: isAdmin } = await client.rpc('is_staff', { roles: ['admin'] })
  if (!isAdmin) throw createError({ statusCode: 403, statusMessage: 'Admins only' })
  if (kind === 'refund') await sendRefund(event, String(id))
  else await sendPayout(event, String(id))
  return { ok: true }
})
