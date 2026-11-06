import type { Database } from '~/types/database.types'
import { dogPhotoUrl } from './dogs'

// Reserving a dog with a deposit, paying the balance, and the handover. The rules live in the database
// (public.money_rules) and are mirrored here for the words on screen; the database's figures are the ones charged.
export const moneyRules = { depositPercent: 10, holdDays: 5, commissionPercent: 5 } as const

export const depositFor = (priceNaira: number) => Math.ceil(priceNaira * moneyRules.depositPercent / 100)

export type ReservationStatus = Database['public']['Enums']['reservation_status']
type Row = Database['public']['Tables']['reservations']['Row']
type PaymentRow = Database['public']['Tables']['payments']['Row']
type RefundRow = Database['public']['Tables']['refunds']['Row']

export interface Reservation {
  id: string
  ref: string
  dogName: string
  dogFileNo: string
  photo?: string
  storeName: string
  storeId: string
  priceNaira: number
  depositNaira: number
  balanceNaira: number
  status: ReservationStatus
  expiresAt: string
  depositPaidAt: string | null
  paidAt: string | null
  completedAt: string | null
  closedAt: string | null
  closedBy: Row['closed_by']
  closeReason: string
  moneyDecision: Row['money_decision']
  paidNaira: number
  refunds: { amountNaira: number, status: RefundRow['status'], reason: string }[]
  createdAt: string
}

export const reservationColumns = '*, payments (amount_naira, status, kind), refunds (amount_naira, status, reason)'
export type ReservationRow = Row & { payments: Pick<PaymentRow, 'amount_naira' | 'status' | 'kind'>[], refunds: Pick<RefundRow, 'amount_naira' | 'status' | 'reason'>[] }

export const toReservation = (r: ReservationRow, storageUrl: string): Reservation => ({
  id: r.id,
  ref: r.ref,
  dogName: r.dog_name,
  dogFileNo: r.dog_file_no,
  photo: dogPhotoUrl(r.dog_photo_path, storageUrl),
  storeName: r.store_name,
  storeId: r.store_id,
  priceNaira: r.price_naira,
  depositNaira: r.deposit_naira,
  balanceNaira: r.price_naira - r.deposit_naira,
  status: r.status,
  expiresAt: r.expires_at,
  depositPaidAt: r.deposit_paid_at,
  paidAt: r.paid_at,
  completedAt: r.completed_at,
  closedAt: r.closed_at,
  closedBy: r.closed_by,
  closeReason: r.close_reason,
  moneyDecision: r.money_decision,
  // Refunded payments still count as paid here; the refunds list says what went back
  paidNaira: r.payments.filter(p => p.status === 'success').reduce((n, p) => n + p.amount_naira, 0),
  refunds: r.refunds.map(f => ({ amountNaira: f.amount_naira, status: f.status, reason: f.reason })),
  createdAt: r.created_at,
})

// Still in play: a hold or a payment the buyer can act on
export const isActive = (r: Reservation) => r.status === 'held' || r.status === 'paid' || r.status === 'pending'

export const reservationStatus: Record<ReservationStatus, { label: string, tone: string }> = {
  pending: { label: 'Checkout not finished', tone: 'bg-ash-soft text-ink-muted' },
  held: { label: 'Reserved', tone: 'bg-marigold text-on-marigold' },
  paid: { label: 'Paid in full', tone: 'bg-night text-marigold' },
  completed: { label: 'Handed over', tone: 'bg-ash-soft text-ink' },
  cancelled: { label: 'Cancelled', tone: 'bg-ash-soft text-ink-muted' },
  expired: { label: 'Ended', tone: 'bg-ash-soft text-ink-muted' },
}

// The steps, for the progress line on each reservation
export const reservationSteps = (r: Reservation) => [
  { label: 'Deposit', done: !!r.depositPaidAt },
  { label: 'Balance', done: !!r.paidAt },
  { label: 'Handover', done: !!r.completedAt },
]

// What happens to the money after an early end, in the buyer's words
export function moneyNote(r: Reservation): string {
  const refunded = r.refunds.filter(f => f.status === 'done').reduce((n, f) => n + f.amountNaira, 0)
  const refunding = r.refunds.filter(f => f.status === 'due' || f.status === 'sending').reduce((n, f) => n + f.amountNaira, 0)
  if (refunding) return `${formatMoney(refunding)} is on its way back to you. Refunds take 3 to 10 working days to reach your bank.`
  if (refunded) return `${formatMoney(refunded)} was refunded to you.`
  if (r.moneyDecision === 'waiting') return `Dogeash will contact you about your ${formatMoney(r.depositNaira)} deposit.`
  if (r.moneyDecision === 'release') return 'Your deposit went to the store, as agreed with Dogeash.'
  return ''
}

export const formatMoney = (naira: number) => `₦${naira.toLocaleString('en-NG')}`

// "4 days 6 hours left", "3 hours left", "Ends soon"
export function timeLeft(iso: string, now = Date.now()) {
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return 'Ends soon'
  const hours = Math.floor(ms / 3_600_000)
  const days = Math.floor(hours / 24)
  if (days) return `${days} ${days === 1 ? 'day' : 'days'}${hours % 24 ? ` ${hours % 24} h` : ''} left`
  if (hours) return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`
  return `${Math.max(1, Math.floor(ms / 60_000))} min left`
}
