import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { Database } from '~/types/database.types'
import { todayIso } from '~/utils/time'
import { useSession } from './useSession'

// The buyer's care appointments (Supabase: care_bookings): requesting one from a provider's page, the
// provider's answer, and cancelling. A booking for one of My dogs can let the provider add the visit to the
// dog's record. Actions return an error message, or null when they worked.
export type CareBookingStatus = Database['public']['Enums']['care_booking_status']

export interface CareBooking {
  id: string
  providerId: string
  providerName: string
  providerSlug: string
  service: string
  // Everything asked for in this appointment (service is the first)
  services: string[]
  day: string
  slot: string
  place: 'premises' | 'home'
  dogName: string
  ownedDogId: string | null
  shareRecord: boolean
  status: CareBookingStatus
  providerNote: string
  createdAt: string
}

export interface CareBookingRequest {
  providerId: string
  service: string
  services?: string[]
  day: string
  slot: string
  place: 'premises' | 'home'
  ownedDogId?: string | null
  dogName?: string
  shareRecord?: boolean
}

export const careBookingStatus: Record<CareBookingStatus, { label: string, tone: string }> = {
  requested: { label: 'Awaiting reply', tone: 'bg-ash-soft text-ink-muted' },
  confirmed: { label: 'Confirmed', tone: 'bg-marigold-soft text-ink' },
  declined: { label: 'Declined', tone: 'bg-danger/12 text-danger' },
  cancelled: { label: 'Cancelled', tone: 'bg-ash-soft text-ink-muted' },
  done: { label: 'Done', tone: 'bg-ash-soft text-ink' },
}

const columns = 'id, service, services, day, slot, place, dog_name, owned_dog_id, share_record, status, provider_note, created_at, care_providers (public_id, name, slug)'

export function useCareBookings() {
  const supabase = useSupabaseClient()
  const { user } = useSession()
  const mine = useState<CareBooking[]>('buyer-care-bookings', () => [])
  const loaded = useState('buyer-care-bookings-loaded', () => false)
  const isUpcoming = (b: CareBooking) => (b.status === 'requested' || b.status === 'confirmed') && b.day >= todayIso()
  const upcoming = computed(() => mine.value.filter(isUpcoming))
  const past = computed(() => mine.value.filter(b => !isUpcoming(b)).reverse())

  async function loadMine() {
    if (!user.value) return (mine.value = [])
    const { data } = await supabase.from('care_bookings').select(columns).eq('buyer_id', user.value.id).order('day').order('slot')
    mine.value = (data ?? []).map((r: any) => ({
      id: r.id,
      // A provider Dogeash has since hidden can't be read; the booking still shows
      providerId: r.care_providers?.public_id ?? '',
      providerName: r.care_providers?.name ?? 'A care provider',
      providerSlug: r.care_providers?.slug ?? '',
      service: r.service,
      services: r.services?.length ? r.services : [r.service],
      day: r.day,
      slot: r.slot,
      place: r.place,
      dogName: r.dog_name,
      ownedDogId: r.owned_dog_id,
      shareRecord: r.share_record,
      status: r.status,
      providerNote: r.provider_note,
      createdAt: r.created_at,
    }))
    loaded.value = true
  }

  async function request(b: CareBookingRequest): Promise<string | null> {
    const { data: provider } = await supabase.from('care_providers').select('id').eq('public_id', b.providerId).maybeSingle()
    if (!provider) return 'This provider isn\'t taking bookings yet.'
    const { error } = await supabase.from('care_bookings').insert({
      provider_id: provider.id,
      service: b.service,
      services: b.services?.length ? b.services : [b.service],
      day: b.day,
      slot: b.slot,
      place: b.place,
      owned_dog_id: b.ownedDogId ?? null,
      dog_name: b.dogName?.trim() ?? '',
      share_record: !!(b.ownedDogId && b.shareRecord),
    })
    if (error) return careRefusal(error.message)
    await loadMine()
    return null
  }

  // Change a booking the provider hasn't answered yet (services, day, time, place)
  async function edit(id: string, b: { services: string[], day: string, slot: string, place: 'premises' | 'home' }): Promise<string | null> {
    const { error } = await supabase.rpc('edit_care_booking', { booking: id, new_services: b.services, new_day: b.day, new_slot: b.slot, new_place: b.place })
    if (error) return careRefusal(error.message)
    await loadMine()
    return null
  }

  async function cancel(id: string): Promise<string | null> {
    const { error } = await supabase.rpc('set_care_booking_status', { booking: id, to_status: 'cancelled' })
    if (error) return 'That didn\'t work. Try again.'
    await loadMine()
    return null
  }

  // A provider's times that are already full, as "2026-11-12 9:00" (for the booking dialog)
  async function fullSlots(providerId: string): Promise<string[]> {
    const { data } = await supabase.rpc('care_full_slots', { provider: providerId })
    return (data ?? []).map(s => `${s.day} ${s.slot}`)
  }

  // Fully booked: ask to be told (in the bell) when a time in the next three weeks frees up
  async function joinWaitlist(providerId: string): Promise<string | null> {
    const { error } = await supabase.rpc('join_care_waitlist', { provider: providerId })
    return error ? careRefusal(error.message) : null
  }

  return { mine, loaded, upcoming, past, loadMine, request, edit, cancel, fullSlots, joinWaitlist }
}

// The database's refusal of a booking, in words for the buyer (its messages are already written for people)
function careRefusal(message: string) {
  const known = ['already booked', 'already have a care appointment', 'already have a booking with this provider', 'provider\'s services', 'at least one', 'up to 5', 'already answered', 'next three weeks', 'manage this listing', 'isn\'t taking bookings', 'from tomorrow', 'next two months', 'doesn\'t work on that day', 'provider\'s times', 'doesn\'t visit homes', 'waiting for an answer', 'can\'t make bookings']
  return known.some(k => message.includes(k)) ? message.replace(/^.*?: /, '') : 'That didn\'t send. Try again.'
}
