import { useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { ReservationStatus } from '~/utils/reservations'
import { fetchError } from '~/utils/fetchError'

// Admin › Payments (admin_money()): every reservation with money on it, refunds and payouts, and what's
// waiting for Dogeash. Deciding on a deposit and retrying go through the site's server, which sends the money.
export interface AdminReservation {
  id: string
  ref: string
  dog_name: string
  dog_file_no: string
  store_name: string
  store_id: string
  buyer_id: string
  buyer_name: string
  buyer_email: string | null
  price_naira: number
  deposit_naira: number
  paid_naira: number
  status: ReservationStatus
  money_decision: 'waiting' | 'refund' | 'release' | null
  close_reason: string
  closed_by: string | null
  expires_at: string
  created_at: string
  closed_at: string | null
}
export type MoneyMoveStatus = 'due' | 'sending' | 'done' | 'failed'
export interface AdminRefund { id: string, amount_naira: number, status: MoneyMoveStatus, reason: string, failure: string, created_at: string, done_at: string | null, ref: string, dog_name: string }
export interface AdminPayout { id: string, amount_naira: number, status: MoneyMoveStatus, failure: string, created_at: string, done_at: string | null, ref: string, dog_name: string, store_name: string, store_id: string, has_account: boolean }
export interface AdminMoneyTotals { held: number, waiting: number, commission: number, paidOut: number, refunded: number, stuck: number }

export function useAdminMoney() {
  const supabase = useSupabaseClient()
  const reservations = useState<AdminReservation[]>('admin-money-reservations', () => [])
  const refunds = useState<AdminRefund[]>('admin-money-refunds', () => [])
  const payouts = useState<AdminPayout[]>('admin-money-payouts', () => [])
  const totals = useState<AdminMoneyTotals | null>('admin-money-totals', () => null)
  const loaded = useState('admin-money-loaded', () => false)

  async function load() {
    // Refunds and payouts Paystack has settled since (in case a webhook didn't arrive)
    await $fetch('/api/payments/sync', { method: 'POST' }).catch(() => null)
    const { data } = await supabase.rpc('admin_money')
    const d = data as unknown as { reservations: AdminReservation[], refunds: AdminRefund[], payouts: AdminPayout[], totals: AdminMoneyTotals } | null
    reservations.value = d?.reservations ?? []
    refunds.value = d?.refunds ?? []
    payouts.value = d?.payouts ?? []
    totals.value = d?.totals ?? null
    loaded.value = true
  }

  async function post(path: string, body: Record<string, string>): Promise<string | null> {
    try {
      await $fetch(path, { method: 'POST', body })
    }
    catch (e) {
      return fetchError(e)
    }
    await load()
    return null
  }
  const decide = (reservationId: string, decision: 'refund' | 'release', note: string) => post('/api/admin/deposit', { reservationId, decision, note })
  const retry = (kind: 'refund' | 'payout', id: string) => post('/api/admin/money-retry', { kind, id })

  return { reservations, refunds, payouts, totals, loaded, load, decide, retry }
}
