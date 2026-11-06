import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import type { AuditEntry, StoreStatus } from '~/utils/admin'

// Admin detail pages: everything about one store (admin_store()) or one person (admin_person()).
// Message text never comes back here: only counts and dates.
export interface AdminStoreDetail {
  store: { id: string, public_id: string, slug: string, name: string, tagline: string, city: string, area: string, state: string, founded: number | null, status: StoreStatus, status_note: string, status_changed_at: string | null, rating: number, reviews_count: number, created_at: string, about: string | null, owner_profile: { name?: string, title?: string } | null, inspection: { status?: string, date?: string, by?: string } | null, visits_paused: boolean, pause_note: string, logo_path: string | null }
  team: { id: string, name: string, email: string, phone: string | null, role: 'owner' | 'manager' | 'handler', since: string, blocked: boolean }[]
  dogs: { id: string, file_no: string, name: string, breed: string, status: string, level: number, price_naira: number, photo_path: string | null, updated_at: string }[]
  reviews: { id: string, rating: number, body: string, author_name: string, store_reply: string | null, created_at: string }[]
  visits: { by_status: Record<string, number>, recent: { id: string, day: string, slot: string, status: string, buyer_name: string, created_at: string }[] }
  conversations: number
  application: { address: string, contact_phone: string, preferred_days: string[], submitted_at: string | null, id_doc_path: string | null, cac_doc_path: string | null, cac_registered: boolean } | null
  inspections: { id: string, status: 'scheduled' | 'passed' | 'failed' | 'cancelled', scheduled_for: string, completed_at: string | null, inspector: string | null }[]
  care: number
  open_reports: number
  audit: AuditEntry[]
}

export interface AdminPersonDetail {
  person: { id: string, name: string, email: string, phone: string | null, city: string | null, created_at: string, last_sign_in_at: string | null, property: string | null, experience: string | null, notify: { email: boolean | null, sms: boolean | null, whatsapp: boolean | null } }
  staff_role: 'admin' | 'inspector' | null
  blocked: { reason: string, blocked_at: string } | null
  stores: { id: string, name: string, status: StoreStatus, role: 'owner' | 'manager' | 'handler', since: string }[]
  visits: { day: string, slot: string, status: string, store: string, store_id: string }[]
  conversations: { store: string, store_id: string, last_message_at: string, messages: number }[]
  reviews: { id: string, rating: number, body: string, store: string, store_id: string, created_at: string }[]
  reports_made: { kind: string, target_id: string, reason: string, status: string, created_at: string }[]
  shortlisted: number
  audit: AuditEntry[]
}

export function useAdminDetail() {
  const supabase = useSupabaseClient()
  const error = ref('')

  async function store(id: string) {
    const { data, error: e } = await supabase.rpc('admin_store', { target: id })
    error.value = e ? (e.message.includes('No store') ? 'No store with that id.' : 'The store didn\'t load. Your one-time code may have expired.') : ''
    return (data as unknown as AdminStoreDetail | null) ?? null
  }

  async function person(id: string) {
    const { data, error: e } = await supabase.rpc('admin_person', { target: id })
    error.value = e ? 'The account didn\'t load. Your one-time code may have expired.' : ''
    return (data as unknown as AdminPersonDetail | null) ?? null
  }

  return { error, store, person }
}
