import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { refused, sendDueMoney } from '../../utils/payments'

// Admin: after a buyer cancelled or a hold ran out, refund the deposit or release it to the store.
// The database checks the admin (with their one-time code); then the money goes out.
export default defineEventHandler(async (event) => {
  const { reservationId, decision, note } = await readBody<{ reservationId?: string, decision?: string, note?: string }>(event)
  if (!reservationId || (decision !== 'refund' && decision !== 'release')) throw createError({ statusCode: 400, statusMessage: 'Refund or release which reservation?' })
  const client = await serverSupabaseClient<Database>(event)
  const { error } = await client.rpc('admin_decide_deposit', { reservation: String(reservationId), decision, note: String(note ?? '') })
  if (error) throw refused(error)
  await sendDueMoney(event, String(reservationId))
  return { ok: true }
})
