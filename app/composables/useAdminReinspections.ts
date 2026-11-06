import { useState, useSupabaseClient } from '#imports'

// Admin › Re-inspections: verified stores by when their year of verification runs out (admin_reinspections()),
// and sending the 30-day reminders now (admin_send_reinspection_reminders()).
export interface Reinspection { public_id: string, name: string, city: string, verified_until: string | null, last_inspected: string | null, booked: { id: string, scheduled_for: string } | null }

export function useAdminReinspections() {
  const supabase = useSupabaseClient()
  const stores = useState<Reinspection[]>('admin-reinspections', () => [])
  const loaded = useState('admin-reinspections-loaded', () => false)

  async function load() {
    const { data } = await supabase.rpc('admin_reinspections')
    stores.value = (data as unknown as Reinspection[] | null) ?? []
    loaded.value = true
  }

  // Returns how many stores were reminded, or null when it failed
  async function remind(): Promise<number | null> {
    const { data, error } = await supabase.rpc('admin_send_reinspection_reminders')
    return error ? null : (data as number)
  }

  return { stores, loaded, load, remind }
}
