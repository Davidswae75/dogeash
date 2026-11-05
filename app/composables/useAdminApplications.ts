import { useState, useSupabaseClient } from '#imports'
import type { AdminApplication } from '~/utils/admin'
import { useAdmin } from './useAdmin'

// Admin › Applications: stores waiting for review, and those sent back (admin_applications()). Documents are
// private: they open through a link that works for a minute. Deciding uses the store status change.
export function useAdminApplications() {
  const supabase = useSupabaseClient()
  const applications = useState<AdminApplication[]>('admin-applications', () => [])
  const loaded = useState('admin-applications-loaded', () => false)

  async function load() {
    const { data } = await supabase.rpc('admin_applications')
    applications.value = (data as unknown as AdminApplication[] | null) ?? []
    loaded.value = true
  }

  async function openDoc(path: string) {
    const { data } = await supabase.storage.from('store-documents').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
  }

  // Approve (verified) or send back (draft, with a reason); then the list reloads
  async function decide(app: AdminApplication, approve: boolean, note: string): Promise<string | null> {
    const error = await useAdmin().setStoreStatus({ public_id: app.public_id }, approve ? 'verified' : 'draft', note)
    if (!error) await load()
    return error
  }

  return { applications, loaded, load, openDoc, decide }
}
