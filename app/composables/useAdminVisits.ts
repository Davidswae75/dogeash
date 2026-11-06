import { useState, useSupabaseClient } from '#imports'

// Admin › Visits: every kennel visit request of the last 60 days and ahead (admin_visits()), how each store
// answers, and nudging a store about a waiting request (admin_nudge_visit()).
export interface AdminVisit {
  id: string
  day: string
  slot: string
  status: 'requested' | 'confirmed' | 'declined' | 'cancelled' | 'done'
  service: string
  place: 'kennel' | 'home'
  store_note: string | null
  created_at: string
  updated_at: string
  buyer_name: string
  buyer_email: string | null
  buyer_id: string
  store_id: string
  store_name: string
  needs_chasing: boolean
  missed: boolean
}
export interface AdminVisitStore { store_id: string, store_name: string, requests: number, answered: number, median_hours: number | null, missed: number, waiting: number }

export function useAdminVisits() {
  const supabase = useSupabaseClient()
  const visits = useState<AdminVisit[]>('admin-visits', () => [])
  const stores = useState<AdminVisitStore[]>('admin-visit-stores', () => [])
  const loaded = useState('admin-visits-loaded', () => false)

  async function load() {
    const { data } = await supabase.rpc('admin_visits')
    const d = data as unknown as { visits: AdminVisit[], stores: AdminVisitStore[] } | null
    visits.value = d?.visits ?? []
    stores.value = d?.stores ?? []
    loaded.value = true
  }

  async function nudge(v: AdminVisit): Promise<string | null> {
    const { error } = await supabase.rpc('admin_nudge_visit', { target: v.id })
    return error ? (error.message.includes('answered') ? 'That visit has been answered.' : 'That didn\'t work. Try again.') : null
  }

  return { visits, stores, loaded, load, nudge }
}
