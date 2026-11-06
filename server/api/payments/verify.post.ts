import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { settlePayment } from '../../utils/payments'

// Back from Paystack's checkout: check the payment with Paystack and record it.
// Only for your own payments (the access rules hide everyone else's).
export default defineEventHandler(async (event) => {
  const { reference } = await readBody<{ reference?: string }>(event)
  if (!reference) throw createError({ statusCode: 400, statusMessage: 'Which payment?' })
  const client = await serverSupabaseClient<Database>(event)
  const { data } = await client.from('payments').select('id').eq('reference', String(reference)).maybeSingle()
  if (!data) throw createError({ statusCode: 404, statusMessage: 'No such payment on your account' })
  return settlePayment(event, String(reference))
})
