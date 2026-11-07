import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { refused, sendDueMoney } from '../../utils/payments'

// A store's owner or manager cancels a reservation: everything the buyer paid is refunded straight away
export default defineEventHandler(async (event) => {
  const { reservationId, reason } = await readBody<{ reservationId?: string, reason?: string }>(event)
  if (!reservationId) throw createError({ statusCode: 400, statusMessage: 'Which reservation?' })
  const client = await serverSupabaseClient<Database>(event)
  const { error } = await client.rpc('store_cancel_reservation', { reservation: String(reservationId), reason: String(reason ?? '') })
  if (error) throw refused(error)
  await sendDueMoney(event, String(reservationId))
  return { ok: true }
})
