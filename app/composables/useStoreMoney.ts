import { computed } from 'vue'
import { useRuntimeConfig, useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { Database } from '~/types/database.types'
import type { ReservationStatus } from '~/utils/reservations'
import { dogPhotoUrl } from '~/utils/dogs'
import { fetchError } from '~/utils/fetchError'
import { useStoreContext } from './useStoreContext'

// The store dashboard's money: reservations on its dogs (owners and managers), its payouts and the bank
// account they go to (owners). Changing the account and cancelling go through the site's server, which
// talks to Paystack. Actions return an error message, or null when they worked.
export interface StoreReservation {
  id: string
  ref: string
  dogName: string
  dogFileNo: string
  photo?: string
  priceNaira: number
  depositNaira: number
  commissionNaira: number
  paidNaira: number
  status: ReservationStatus
  expiresAt: string
  depositPaidAt: string | null
  paidAt: string | null
  completedAt: string | null
  closedAt: string | null
  closedBy: string | null
  closeReason: string
  moneyDecision: 'waiting' | 'refund' | 'release' | null
  buyerName: string
  buyerPhone: string | null
}
export type StorePayout = Pick<Database['public']['Tables']['payouts']['Row'], 'id' | 'amount_naira' | 'status' | 'failure' | 'created_at' | 'done_at'> & { reservations: { ref: string, dog_name: string } | null }
export type PayoutAccount = Pick<Database['public']['Tables']['store_payout_accounts']['Row'], 'bank_name' | 'account_name' | 'account_last4' | 'updated_at'>

export function useStoreMoney() {
  const supabase = useSupabaseClient()
  const storageUrl = useRuntimeConfig().public.supabase.url as string
  const { storeUuid, can } = useStoreContext()
  const reservations = useState<StoreReservation[]>('store-reservations', () => [])
  const payouts = useState<StorePayout[]>('store-payouts', () => [])
  const account = useState<PayoutAccount | null>('store-payout-account', () => null)
  const loaded = useState('store-money-loaded', () => false)
  let synced = false

  const canSeeMoney = computed(() => can('payouts'))
  const canSeeReservations = computed(() => can('sales'))

  async function load() {
    const id = await storeUuid()
    if (!id) return
    const [res, outs, acct] = await Promise.all([
      canSeeReservations.value ? supabase.rpc('store_reservations', { target_store: id }) : Promise.resolve({ data: [] }),
      canSeeMoney.value ? supabase.from('payouts').select('id, amount_naira, status, failure, created_at, done_at, reservations (ref, dog_name)').eq('store_id', id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
      canSeeMoney.value ? supabase.from('store_payout_accounts').select('bank_name, account_name, account_last4, updated_at').eq('store_id', id).maybeSingle() : Promise.resolve({ data: null }),
    ])
    reservations.value = ((res.data ?? []) as any[]).map(r => ({
      id: r.id,
      ref: r.ref,
      dogName: r.dog_name,
      dogFileNo: r.dog_file_no,
      photo: dogPhotoUrl(r.dog_photo_path, storageUrl),
      priceNaira: r.price_naira,
      depositNaira: r.deposit_naira,
      commissionNaira: r.commission_naira,
      paidNaira: r.paid_naira,
      status: r.status,
      expiresAt: r.expires_at,
      depositPaidAt: r.deposit_paid_at,
      paidAt: r.paid_at,
      completedAt: r.completed_at,
      closedAt: r.closed_at,
      closedBy: r.closed_by,
      closeReason: r.close_reason,
      moneyDecision: r.money_decision,
      buyerName: r.buyer_name,
      buyerPhone: r.buyer_phone,
    }))
    payouts.value = (outs.data ?? []) as unknown as StorePayout[]
    account.value = (acct.data ?? null) as PayoutAccount | null
    loaded.value = true
    // A payout on its way: ask Paystack if it landed (in case a webhook didn't arrive), then show the answer
    if (!synced && payouts.value.some(p => p.status === 'sending')) {
      synced = true
      const { settled } = await $fetch<{ settled: number }>('/api/payments/sync', { method: 'POST' }).catch(() => ({ settled: 0 }))
      if (settled) await load()
    }
  }

  // Figures for the top of the page
  const totals = computed(() => ({
    held: reservations.value.filter(r => r.status === 'held' || r.status === 'paid').reduce((n, r) => n + r.paidNaira, 0),
    due: payouts.value.filter(p => p.status !== 'done').reduce((n, p) => n + p.amount_naira, 0),
    paidOut: payouts.value.filter(p => p.status === 'done').reduce((n, p) => n + p.amount_naira, 0),
  }))
  const inProgress = computed(() => reservations.value.filter(r => r.status === 'held' || r.status === 'paid'))
  const finished = computed(() => reservations.value.filter(r => r.status !== 'held' && r.status !== 'paid'))

  const banks = useState<{ name: string, code: string }[]>('paystack-banks', () => [])
  async function loadBanks(): Promise<string | null> {
    if (banks.value.length) return null
    try {
      banks.value = await $fetch<{ name: string, code: string }[]>('/api/payouts/banks')
      return null
    }
    catch (e) {
      return fetchError(e)
    }
  }

  async function saveAccount(bankCode: string, accountNumber: string): Promise<string | null> {
    const storeId = await storeUuid()
    try {
      await $fetch('/api/payouts/account', { method: 'POST', body: { storeId, bankCode, accountNumber } })
    }
    catch (e) {
      return fetchError(e)
    }
    await load()
    return null
  }

  async function cancel(id: string, reason: string): Promise<string | null> {
    try {
      await $fetch('/api/payments/store-cancel', { method: 'POST', body: { reservationId: id, reason } })
    }
    catch (e) {
      return fetchError(e)
    }
    await load()
    return null
  }

  return { reservations, payouts, account, loaded, canSeeMoney, canSeeReservations, totals, inProgress, finished, banks, load, loadBanks, saveAccount, cancel }
}
