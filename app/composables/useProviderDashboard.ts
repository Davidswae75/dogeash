import { computed } from 'vue'
import { useRuntimeConfig, useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { CareBookingStatus } from './useCareBookings'
import type { Database } from '~/types/database.types'
import type { CareContacts, CareMilestone, CareProvider, CareRow } from '~/utils/care'
import { careColumns, toCareProvider } from '~/utils/care'
import { checkImage, imagePath } from '~/utils/imageUpload'
import { todayIso } from '~/utils/time'
import { recordError } from './useOwnedDogs'
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
export interface ProviderDetailsDraft extends CareContacts { photo: string | null, gallery: string[], address: string, startedYear: number | null, history: CareMilestone[] }
export interface ProviderProfileDraft { person: string, areas: string, about: string, hours: string, priceFrom: number, homeVisits: boolean, takingBookings: boolean, weekdays: number[], slots: string[], services: string[], slotCapacity: number }

export function useProviderDashboard() {
  const supabase = useSupabaseClient()
  const storageUrl = useRuntimeConfig().public.supabase.url as string
  const { providers } = useSession()
  const membership = computed(() => providers.value[0])
  const listing = useState<CareProvider | null>('provider-listing', () => null)
  const bookings = useState<ProviderBooking[]>('provider-bookings', () => [])
  const loaded = useState('provider-loaded', () => false)
  const contacts = useState<CareContacts>('provider-contacts', () => ({ phone: '', whatsapp: '', email: '' }))

  const requests = computed(() => bookings.value.filter(b => b.status === 'requested'))
  const comingUp = computed(() => bookings.value.filter(b => b.status === 'confirmed' && b.day >= todayIso()))
  // Confirmed but past (to mark done), done, declined, cancelled: newest first
  const earlier = computed(() => bookings.value.filter(b => b.status !== 'requested' && !(b.status === 'confirmed' && b.day >= todayIso())).reverse())

  async function load() {
    const m = membership.value
    if (!m) return
    const [{ data: row }, { data }, { data: c }] = await Promise.all([
      supabase.from('care_providers').select(careColumns).eq('id', m.uuid).maybeSingle(),
      supabase.rpc('provider_bookings', { provider: m.uuid }),
      supabase.from('care_provider_contacts').select('phone, whatsapp, email').eq('provider_id', m.uuid).maybeSingle(),
    ])
    listing.value = row ? toCareProvider(row as unknown as CareRow, storageUrl) : null
    contacts.value = { phone: c?.phone ?? '', whatsapp: c?.whatsapp ?? '', email: c?.email ?? '' }
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
    if (error) return error.message.includes('owned_dog_records_') ? recordError(error.message) : (error.message.replace(/^.*?: /, '') || 'That didn\'t save. Try again.')
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
    const { services, slotCapacity, ...rest } = p
    const { error } = await supabase.rpc('provider_save_profile', { provider: m.uuid, p: rest as never })
    if (error) return 'That didn\'t save. Check the details and try again.'
    // What they offer, and how many clients one time takes
    const { error: e2 } = await supabase.rpc('provider_save_services', { provider: m.uuid, list: services, capacity: slotCapacity })
    if (e2) return e2.message.includes('at least one') ? 'Choose at least one service.' : e2.message.includes('12') ? 'Up to 12 services.' : 'Your services didn\'t save. Try again.'
    await load()
    return null
  }

  // A photo goes in the provider's own folder under a fresh name; it's only used once the details are saved
  async function uploadPhoto(file: File): Promise<{ path?: string, error?: string }> {
    const m = membership.value
    if (!m) return { error: 'You don\'t manage a listing.' }
    const invalid = checkImage(file)
    if (invalid) return { error: invalid }
    const path = imagePath(m.uuid, file)
    const { error } = await supabase.storage.from('care-media').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
    return error ? { error: 'The photo didn\'t upload. Check your connection and try again.' } : { path }
  }

  // Photos, workplace, history and contact. Photos no longer used are removed from storage.
  async function saveDetails(d: ProviderDetailsDraft): Promise<string | null> {
    const m = membership.value
    if (!m) return 'You don\'t manage a listing.'
    const before = [listing.value?.photoPath, ...(listing.value?.galleryPaths ?? [])].filter((p): p is string => !!p)
    const { error } = await supabase.rpc('provider_save_details', { provider: m.uuid, d: d as never })
    if (error) return error.message.includes('own uploads') ? 'Upload the photos again and save.' : error.message.includes('Up to 8') ? error.message.replace(/^.*?: /, '') + '.' : 'That didn\'t save. Check the details and try again.'
    const unused = before.filter(p => p !== d.photo && !d.gallery.includes(p))
    if (unused.length) await supabase.storage.from('care-media').remove(unused)
    await load()
    return null
  }
  const mediaUrl = (path: string | null | undefined) => (path ? `${storageUrl}/storage/v1/object/public/care-media/${path}` : undefined)

  return { membership, listing, bookings, contacts, loaded, requests, comingUp, earlier, load, setStatus, addRecord, recordsFor, saveProfile, uploadPhoto, saveDetails, mediaUrl }
}
