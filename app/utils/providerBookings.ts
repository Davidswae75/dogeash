import type { ProviderBooking } from '~/composables/useProviderDashboard'
import type { CsvColumn } from './csv'
import { careBookingStatus } from '~/composables/useCareBookings'
import { isoDate, todayIso } from './time'

// The provider's bookings page: which period (this month by default), which statuses, a search, an order,
// and the same rows as a CSV download.

export type BookingPeriod = 'this-month' | 'last-month' | 'next-month' | 'last-3-months' | 'all'
export const bookingPeriods: { value: BookingPeriod, label: string }[] = [
  { value: 'this-month', label: 'This month' },
  { value: 'next-month', label: 'Next month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-3-months', label: 'Last 3 months' },
  { value: 'all', label: 'Everything' },
]

// First and last day of the period, as "2026-11-01" … "2026-11-30" (null for everything)
export function periodRange(p: BookingPeriod, now = new Date()): { from: string, to: string } | null {
  const y = now.getFullYear()
  const m = now.getMonth()
  const span = (startMonth: number, months: number) => ({ from: isoDate(new Date(y, startMonth, 1)), to: isoDate(new Date(y, startMonth + months, 0)) })
  switch (p) {
    case 'this-month': return span(m, 1)
    case 'next-month': return span(m + 1, 1)
    case 'last-month': return span(m - 1, 1)
    case 'last-3-months': return span(m - 2, 3)
    default: return null
  }
}
// "November 2026", "Sep – Nov 2026"
export function periodLabel(p: BookingPeriod) {
  const r = periodRange(p)
  if (!r) return 'All bookings'
  const from = new Date(`${r.from}T12:00:00`)
  const to = new Date(`${r.to}T12:00:00`)
  return r.from.slice(0, 7) === r.to.slice(0, 7)
    ? from.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
    : `${from.toLocaleDateString('en-NG', { month: 'short' })} – ${to.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}`
}

// One status at a time (or all)
export type BookingStatusFilter = 'all' | 'requested' | 'confirmed' | 'done' | 'closed'
export const bookingStatusFilters: { value: BookingStatusFilter, label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'To answer' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'done', label: 'Done' },
  { value: 'closed', label: 'Declined or cancelled' },
]
export const inStatus = (b: ProviderBooking, f: BookingStatusFilter) => (f === 'all' ? true : f === 'closed' ? b.status === 'declined' || b.status === 'cancelled' : b.status === f)

export type BookingSort = 'soonest' | 'latest' | 'status' | 'buyer'
export const bookingSorts: { value: BookingSort, label: string }[] = [
  { value: 'soonest', label: 'Date: earliest first' },
  { value: 'latest', label: 'Date: latest first' },
  { value: 'status', label: 'Status: to answer first' },
  { value: 'buyer', label: 'Buyer: A to Z' },
]
const statusOrder = { requested: 0, confirmed: 1, done: 2, declined: 3, cancelled: 4 } as const
const minutes = (slot: string) => Number(slot.split(':')[0]) * 60 + Number(slot.split(':')[1] ?? 0)
const when = (b: ProviderBooking) => `${b.day} ${String(minutes(b.slot)).padStart(4, '0')}`

// The bookings in a period (for the counts beside each status)
export function inPeriod(list: ProviderBooking[], p: BookingPeriod) {
  const range = periodRange(p)
  return range ? list.filter(b => b.day >= range.from && b.day <= range.to) : list
}

export function filterBookings(list: ProviderBooking[], o: { period: BookingPeriod, status: BookingStatusFilter, query: string, sort: BookingSort }) {
  const range = periodRange(o.period)
  const q = o.query.trim().toLowerCase()
  const rows = list.filter(b =>
    (!range || (b.day >= range.from && b.day <= range.to))
    && inStatus(b, o.status)
    && (!q || [b.buyerName, b.dogName, b.service, b.note, b.buyerPhone ?? ''].some(t => t.toLowerCase().includes(q))))
  const by = {
    soonest: (a: ProviderBooking, b: ProviderBooking) => when(a).localeCompare(when(b)),
    latest: (a: ProviderBooking, b: ProviderBooking) => when(b).localeCompare(when(a)),
    status: (a: ProviderBooking, b: ProviderBooking) => statusOrder[a.status] - statusOrder[b.status] || when(a).localeCompare(when(b)),
    buyer: (a: ProviderBooking, b: ProviderBooking) => a.buyerName.localeCompare(b.buyerName) || when(a).localeCompare(when(b)),
  }
  return [...rows].sort(by[o.sort])
}

// What each status means for what the provider can do now
export const canMarkDone = (b: ProviderBooking) => b.status === 'confirmed' && b.day <= todayIso()
export const canAddToRecord = (b: ProviderBooking) => b.canAddRecord && (b.status === 'confirmed' || b.status === 'done')

export const bookingCsv: CsvColumn<ProviderBooking>[] = [
  { label: 'Date', value: b => b.day },
  { label: 'Time', value: b => b.slot },
  { label: 'Services', value: b => b.service },
  { label: 'Status', value: b => careBookingStatus[b.status].label },
  { label: 'Buyer', value: b => b.buyerName },
  { label: 'Phone', value: b => b.buyerPhone ?? '' },
  { label: 'Dog', value: b => b.dogName },
  { label: 'Where', value: b => (b.place === 'home' ? 'At the buyer\'s home' : 'At your premises') },
  { label: 'Buyer\'s note', value: b => b.note },
  { label: 'Your note', value: b => b.providerNote },
  { label: 'Record lines added', value: b => b.recordsAdded },
  { label: 'Requested on', value: b => b.createdAt.slice(0, 10) },
]
