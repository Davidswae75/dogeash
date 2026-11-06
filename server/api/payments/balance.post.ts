import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import type { CheckoutStart } from '../../utils/payments'
import { openCheckout, refused } from '../../utils/payments'

// Pay the rest of the price on a reservation the buyer holds
export default defineEventHandler(async (event) => {
  const { reservationId } = await readBody<{ reservationId?: string }>(event)
  if (!reservationId) throw createError({ statusCode: 400, statusMessage: 'Which reservation?' })
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.rpc('start_balance_payment', { reservation: String(reservationId) })
  if (error) throw refused(error)
  return openCheckout(event, data as unknown as CheckoutStart)
})
