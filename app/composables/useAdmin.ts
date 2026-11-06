import { useState, useSupabaseClient } from '#imports'
import type { AdminOverview, AdminStore, AuditEntry, SeriesDay, StoreStatus } from '~/utils/admin'

// The admin dashboard's data (Supabase: admin_overview(), admin_audit). The database refuses all of it
// to anyone who isn't staff with a one-time code, whatever the page does.
export function useAdmin() {
  const supabase = useSupabaseClient()
  const overview = useState<AdminOverview | null>('admin-overview', () => null)
  const audit = useState<AuditEntry[]>('admin-audit', () => [])
  const error = useState('admin-error', () => '')
  const stores = useState<AdminStore[]>('admin-stores', () => [])
  // Longer day-by-day history for 90 days or a year (twice the period, to compare with the one before)
  const history = useState<{ days: number, series: SeriesDay[] } | null>('admin-history', () => null)

  async function loadOverview() {
    const [o, a] = await Promise.all([
      supabase.rpc('admin_overview'),
      supabase.from('admin_audit').select('id, actor_name, action, target_type, target_id, detail, created_at').order('created_at', { ascending: false }).limit(15),
    ])
    error.value = o.error ? 'The overview didn\'t load. Your one-time code may have expired: sign in again.' : ''
    // The chart parts default to empty, for a database that doesn't send them yet
    const d = o.data as unknown as Partial<AdminOverview> | null
    overview.value = d ? { ...d, series: d.series ?? [], topStores: d.topStores ?? [], cities: d.cities ?? [] } as AdminOverview : null
    audit.value = (a.data ?? []) as AuditEntry[]
  }

  async function loadHistory(days: number) {
    if (history.value && history.value.days >= days * 2) return
    const { data } = await supabase.rpc('admin_history', { days: days * 2 })
    history.value = { days: days * 2, series: (data as unknown as SeriesDay[] | null) ?? [] }
  }

  async function loadStores() {
    const { data } = await supabase.rpc('admin_stores')
    stores.value = (data as unknown as AdminStore[] | null) ?? []
  }

  // Change a store's status with a note it reads; then everything reloads. Returns an error, or null.
  async function setStoreStatus(store: Pick<AdminStore, 'public_id'>, next: StoreStatus, note: string): Promise<string | null> {
    const { error: e } = await supabase.rpc('admin_set_store_status', { target: store.public_id, next, note: note.trim() })
    if (e) return e.message.includes('reason') ? 'Give the store a reason.' : e.message.includes('Staff only') ? 'Your one-time code has expired. Sign in again.' : 'That didn\'t work. Try again.'
    await Promise.all([loadOverview(), loadStores()])
    return null
  }

  return { overview, audit, error, stores, history, loadOverview, loadHistory, loadStores, setStoreStatus }
}
