import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { CareBookingStatus } from './useCareBookings'
import type { Database } from '~/types/database.types'
import type { CareProvider, CareRow } from '~/utils/care'
import { careColumns, toCareProvider } from '~/utils/care'
import { todayIso } from '~/utils/time'
import { useSession } from './useSession'

// The provider dashboard: the listing this person manages (their first, for now), its bookings, answering
// them, adding to a dog's record when the owner allowed it, and editing the listing. Actions return an
// error message, or null when they worked.
export interface ProviderBooking {
  id: string
  service: string
  day: string
  slot: string
  place: 'premises' | 'home'
  note: string
  dogName: string
  canAddRecord: boolean
  status: CareBookingStatus
  providerNote: string
  buyerName: string
  buyerPhone: string | null
  recordsAdded: number
  createdAt: string
}
export type RecordKind = Database['public']['Enums']['owned_dog_record_kind']
export interface ProviderRecordDraft { kind: RecordKind, title: string, doneOn: string | null, dueOn: string | null, note: string }
export interface ProviderProfileDraft { person: string, areas: string, about: string, hours: string, priceFrom: number, homeVisits: boolean, takingBookings: boolean, weekdays: number[], slots: string[] }

export function useProviderDashboard() {
  const supabase = useSupabaseClient()
  const { providers } = useSession()
  const membership = computed(() => providers.value[0])
  const listing = useState<CareProvider | null>('provider-listing', () => null)
  const bookings = useState<ProviderBooking[]>('provider-bookings', () => [])
  const loaded = useState('provider-loaded', () => false)

  const requests = computed(() => bookings.value.filter(b => b.status === 'requested'))
  const comingUp = computed(() => bookings.value.filter(b => b.status === 'confirmed' && b.day >= todayIso()))
  // Confirmed but past (to mark done), done, declined, cancelled: newest first
  const earlier = computed(() => bookings.value.filter(b => b.status !== 'requested' && !(b.status === 'confirmed' && b.day >= todayIso())).reverse())

  async function load() {
    const m = membership.value
    if (!m) return
    const [{ data: row }, { data }] = await Promise.all([
      supabase.from('care_providers').select(careColumns).eq('id', m.uuid).maybeSingle(),
      supabase.rpc('provider_bookings', { provider: m.uuid }),
    ])
    listing.value = row ? toCareProvider(row as unknown as CareRow) : null
    bookings.value = ((data ?? []) as any[]).map(b => ({
      id: b.id,
      service: b.service,
      day: b.day,
      slot: b.slot,
      place: b.place,
      note: b.note,
      dogName: b.dog_name,
      canAddRecord: b.can_add_record,
      status: b.status,
      providerNote: b.provider_note,
      buyerName: b.buyer_name,
      buyerPhone: b.buyer_phone,
      recordsAdded: b.records_added,
      createdAt: b.created_at,
    }))
    loaded.value = true
  }

  async function setStatus(id: string, status: 'confirmed' | 'declined' | 'done', note = ''): Promise<string | null> {
    const { error } = await supabase.rpc('set_care_booking_status', { booking: id, to_status: status, answer_note: note })
    if (error) return error.message.includes('already been answered') ? 'This booking has already been answered.' : error.message.includes('Confirm the booking first') ? 'Confirm the booking first.' : 'That didn\'t save. Try again.'
    await load()
    return null
  }

  async function addRecord(bookingId: string, r: ProviderRecordDraft): Promise<string | null> {
    const { error } = await supabase.rpc('provider_add_record', { booking: bookingId, rec_kind: r.kind, rec_title: r.title, rec_done: r.doneOn, rec_due: r.dueOn, rec_note: r.note })
    if (error) return error.message.replace(/^.*?: /, '') || 'That didn\'t save. Try again.'
    await load()
    return null
  }

  async function recordsFor(bookingId: string) {
    const { data } = await supabase.rpc('provider_booking_records', { booking: bookingId })
    return (data ?? []) as unknown as { kind: RecordKind, title: string, doneOn: string | null, dueOn: string | null, note: string }[]
  }

  async function saveProfile(p: ProviderProfileDraft): Promise<string | null> {
    const m = membership.value
    if (!m) return 'You don\'t manage a listing.'
    const { error } = await supabase.rpc('provider_save_profile', { provider: m.uuid, p: p as never })
    if (error) return 'That didn\'t save. Check the details and try again.'
    await load()
    return null
  }

  return { membership, listing, bookings, loaded, requests, comingUp, earlier, load, setStatus, addRecord, recordsFor, saveProfile }
}
