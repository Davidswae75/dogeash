import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import type { CheckoutStart } from '../../utils/payments'
import { openCheckout, refused } from '../../utils/payments'

// "Reserve this dog": the database checks the buyer and the dog and fixes the deposit (as the signed-in
// buyer, so its rules apply), then Paystack's checkout opens for that amount.
export default defineEventHandler(async (event) => {
  const { fileNo } = await readBody<{ fileNo?: string }>(event)
  if (!fileNo) throw createError({ statusCode: 400, statusMessage: 'Which dog?' })
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.rpc('start_reservation', { file_no: String(fileNo) })
  if (error) throw refused(error)
  return openCheckout(event, data as unknown as CheckoutStart)
})
