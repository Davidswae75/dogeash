import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { paystack } from '../../utils/paystack'
import { sendStorePayouts } from '../../utils/payments'

// The store owner sets where payouts go. Paystack checks the account with the bank and returns the name on
// it; Dogeash keeps that name, the bank and the last four digits, and Paystack keeps the full number.
// Then anything already waiting for the store is sent.
export default defineEventHandler(async (event) => {
  const { storeId, bankCode, accountNumber } = await readBody<{ storeId?: string, bankCode?: string, accountNumber?: string }>(event)
  const number = String(accountNumber ?? '').replace(/\D/g, '')
  if (!storeId || !bankCode) throw createError({ statusCode: 400, statusMessage: 'Choose the bank' })
  if (number.length !== 10) throw createError({ statusCode: 400, statusMessage: 'Nigerian account numbers have 10 digits' })

  // As the signed-in person: only the store's owner may change where its money goes
  const client = await serverSupabaseClient<Database>(event)
  const { data: isOwner } = await client.rpc('has_store_role', { target_store: storeId, roles: ['owner'] })
  if (!isOwner) throw createError({ statusCode: 403, statusMessage: 'Only the store\'s owner can set the payout account' })
  const { data: me } = await client.auth.getUser()

  const resolved = await paystack<{ account_name: string }>(event, `/bank/resolve?account_number=${number}&bank_code=${encodeURIComponent(bankCode)}`)
    .catch(() => { throw createError({ statusCode: 400, statusMessage: 'The bank didn\'t recognise that account number. Check it and the bank.' }) })
  const recipient = await paystack<{ recipient_code: string, details: { bank_name: string } }>(event, '/transferrecipient', {
    type: 'nuban', name: resolved.account_name, account_number: number, bank_code: bankCode, currency: 'NGN',
  })

  const service = serverSupabaseServiceRole<Database>(event)
  const row = {
    store_id: storeId,
    bank_code: bankCode,
    bank_name: recipient.details?.bank_name ?? '',
    account_name: resolved.account_name,
    account_last4: number.slice(-4),
    recipient_code: recipient.recipient_code,
    updated_by: me.user?.id ?? null,
    updated_at: new Date().toISOString(),
  }
  const { error } = await service.from('store_payout_accounts').upsert(row)
  if (error) throw createError({ statusCode: 500, statusMessage: 'That didn\'t save. Try again.' })

  await sendStorePayouts(event, storeId)
  return { bankName: row.bank_name, accountName: row.account_name, last4: row.account_last4 }
})
