import { createError, defineEventHandler } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { syncSendingMoney } from '../../utils/payments'

// Refunds and payouts still "sending": ask Paystack how they ended. Run when the admin Payments page, a
// buyer's Reservations page or a store's Payouts page opens, so nothing waits on a missed webhook.
// Needs a signed-in account (any), so visitors can't make the server call Paystack.
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const { data } = await client.auth.getUser()
  if (!data.user) throw createError({ statusCode: 401, statusMessage: 'Sign in first' })
  return syncSendingMoney(event)
})
