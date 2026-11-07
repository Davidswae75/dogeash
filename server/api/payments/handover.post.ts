import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { refused, sendDueMoney } from '../../utils/payments'

// The buyer confirms they have the dog: the sale completes, and the store's payout goes out
// (or waits for the store's bank account)
export default defineEventHandler(async (event) => {
  const { reservationId } = await readBody<{ reservationId?: string }>(event)
  if (!reservationId) throw createError({ statusCode: 400, statusMessage: 'Which reservation?' })
  const client = await serverSupabaseClient<Database>(event)
  const { error } = await client.rpc('confirm_handover', { reservation: String(reservationId) })
  if (error) throw refused(error)
  await sendDueMoney(event, String(reservationId))
  return { ok: true }
})
