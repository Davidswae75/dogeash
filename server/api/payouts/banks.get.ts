import { defineEventHandler } from 'h3'
import { paystack } from '../../utils/paystack'

// Nigerian banks Paystack can pay into, for the store's bank account form. Kept for a day.
let cache: { at: number, banks: { name: string, code: string }[] } | null = null

export default defineEventHandler(async (event) => {
  if (cache && Date.now() - cache.at < 86_400_000) return cache.banks
  const data = await paystack<{ name: string, code: string, active: boolean, type: string }[]>(event, '/bank?country=nigeria&currency=NGN&perPage=200')
  const banks = data.filter(b => b.active && b.type === 'nuban').map(b => ({ name: b.name, code: b.code })).sort((a, b) => a.name.localeCompare(b.name))
  cache = { at: Date.now(), banks }
  return banks
})
