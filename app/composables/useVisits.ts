import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import { findDog } from '~/utils/dogs'
import { todayIso } from '~/utils/time'
import type { Database } from '~/types/database.types'
import { useSession } from './useSession'

// Kennel-visit requests (Supabase: visits). Buyers request and can cancel; a store's people confirm,
// decline or mark them done. Uses store ids like STR-001 and dog file numbers, like the rest of the app.
export type VisitStatus = Database['public']['Enums']['visit_status']

export interface Visit {
  id: string
  storeId: string
  storeName: string
  storeSlug: string
  dogFileNos: string[]
  service: string
  day: string
  slot: string
  place: 'kennel' | 'home'
  note: string | null
  status: VisitStatus
  storeNote: string | null
  buyerName: string
  buyerPhone: string | null
  createdAt: string
}

export interface VisitRequest { storeId: string, dogFileNos: string[], service: string, day: string, slot: string, place: 'kennel' | 'home', note?: string }

export const visitStatusLabels: Record<VisitStatus, { label: string, tone: string, dot: string }> = {
  requested: { label: 'Awaiting reply', tone: 'bg-ash-soft text-ink-muted', dot: 'bg-ash' },
  confirmed: { label: 'Confirmed', tone: 'bg-marigold-soft text-ink', dot: 'bg-marigold' },
  declined: { label: 'Declined', tone: 'bg-danger/12 text-danger', dot: 'bg-danger' },
  cancelled: { label: 'Cancelled', tone: 'bg-ash-soft text-ink-muted', dot: 'bg-ash' },
  done: { label: 'Done', tone: 'bg-ash-soft text-ink', dot: 'bg-ink' },
}

const columns = 'id, dog_ids, service, day, slot, place, note, status, store_note, buyer_name, buyer_phone, created_at, stores!inner (public_id, name, slug)'

export function useVisits() {
  const supabase = useSupabaseClient()
  const { user } = useSession()
  const mine = useState<Visit[]>('buyer-visits', () => [])
  // Still to happen (requested or confirmed, today on), soonest first; everything else, newest first
  const isUpcoming = (v: Visit) => (v.status === 'requested' || v.status === 'confirmed') && v.day >= todayIso()
  const upcoming = computed(() => mine.value.filter(isUpcoming))
  const past = computed(() => mine.value.filter(v => !isUpcoming(v)).reverse())

  // Database dog ids → file numbers, for the dogs on these visits
  async function withFileNos(rows: any[]): Promise<Visit[]> {
    const ids = [...new Set(rows.flatMap(r => r.dog_ids as string[]))]
    const { data: dogs } = ids.length ? await supabase.from('dogs').select('id, file_no').in('id', ids) : { data: [] }
    const fileNo = Object.fromEntries((dogs ?? []).map(d => [d.id, d.file_no]))
    return rows.map(r => ({
      id: r.id,
      storeId: r.stores.public_id,
      storeName: r.stores.name,
      storeSlug: r.stores.slug,
      dogFileNos: (r.dog_ids as string[]).map(id => fileNo[id]).filter((f): f is string => !!f),
      service: r.service,
      day: r.day,
      slot: r.slot,
      place: r.place,
      note: r.note,
      status: r.status,
      storeNote: r.store_note,
      buyerName: r.buyer_name,
      buyerPhone: r.buyer_phone,
      createdAt: r.created_at,
    }))
  }

  async function loadMine() {
    if (!user.value) return (mine.value = [])
    const { data } = await supabase.from('visits').select(columns).eq('buyer_id', user.value.id).order('day').order('slot')
    mine.value = await withFileNos(data ?? [])
  }

  async function loadForStore(storeId: string) {
    const { data } = await supabase.from('visits').select(columns).eq('stores.public_id', storeId).order('day').order('slot')
    return withFileNos(data ?? [])
  }

  // Returns an error message, or null when the request was sent
  async function request(r: VisitRequest): Promise<string | null> {
    const { data: store } = await supabase.from('stores').select('id').eq('public_id', r.storeId).maybeSingle()
    if (!store) return 'This store isn\'t taking visit requests yet.'
    const { data: dogs } = r.dogFileNos.length ? await supabase.from('dogs').select('id').in('file_no', r.dogFileNos) : { data: [] }
    const { error } = await supabase.from('visits').insert({
      store_id: store.id,
      dog_ids: (dogs ?? []).map(d => d.id),
      service: r.service,
      day: r.day,
      slot: r.slot,
      place: r.place,
      note: r.note?.trim() || null,
    })
    if (error) return visitRefusal(error.message)
    await loadMine()
    return null
  }

  async function setStatus(id: string, status: VisitStatus, storeNote?: string): Promise<string | null> {
    const { error } = await supabase.from('visits').update({ status, ...(storeNote !== undefined ? { store_note: storeNote } : {}) }).eq('id', id)
    if (error) return 'That didn\'t save. Try again.'
    mine.value = mine.value.map(v => (v.id === id ? { ...v, status, storeNote: storeNote ?? v.storeNote } : v))
    return null
  }

  // The store's times that are already full ("2026-11-12 9:00"), so the dialog can cross them out
  async function fullSlots(storeId: string): Promise<string[]> {
    const { data } = await supabase.rpc('store_full_slots', { store: storeId })
    return (data ?? []).map(s => `${s.day} ${s.slot}`)
  }

  return { mine, upcoming, past, loadMine, loadForStore, request, setStatus, fullSlots }
}

// What the database's refusal of a visit request means, in words for the buyer
function visitRefusal(message: string) {
  if (message.includes('from today')) return 'Choose a day from today on.'
  if (message.includes('isn\'t taking visits')) return 'This store has paused visit requests. Message them instead.'
  if (message.includes('on that day')) return 'The store doesn\'t take visits that day. Choose another.'
  if (message.includes('visit times')) return 'Choose one of the store\'s visit times.'
  if (message.includes('only takes visits at the kennel')) return 'This store only takes visits at the kennel.'
  if (message.includes('already booked')) return 'That time is already booked. Choose another.'
  if (message.includes('already have a visit at that time')) return 'You already have a visit at that time. Choose another.'
  return 'The request didn\'t send. Try again.'
}

// "Rambo and Sarge" / "Rambo, Sarge and Zara" for the dogs on a visit
export function visitDogNames(fileNos: string[]) {
  const names = fileNos.map(f => findDog(f)?.name ?? f)
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : (names[0] ?? '')
}
