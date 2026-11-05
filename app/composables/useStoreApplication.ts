import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import type { ApplicationRow, ApplicationValues, DocKind } from '~/utils/storeApplication'
import { useNotify } from './useNotify'
import { useSession } from './useSession'
import { useStoreContext } from './useStoreContext'
import { DOC_MAX_MB, DOC_TYPES, applicationToRow, docKinds } from '~/utils/storeApplication'

// The application of the store the dashboard is showing (Supabase: store_applications, the private
// store-documents bucket, submit_store_application()). Only its owner works on it, and only while the
// store is a draft. Each change returns an error message, or null when it worked.
export function useStoreApplication() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const { storeUuid } = useStoreContext()
  const app = useState<ApplicationRow | null>('store-application', () => null)
  const loaded = useState('store-application-loaded', () => false)
  // The store's latest inspection, when one is booked or done (my_store_inspection())
  const inspection = useState<{ status: string, scheduled_for: string, completed_at: string | null, inspector: string } | null>('store-inspection', () => null)

  async function load() {
    const id = await storeUuid()
    if (!id) return
    const { data } = await supabase.from('store_applications').select('*').eq('store_id', id).maybeSingle()
    app.value = data
    const { data: ins } = await supabase.rpc('my_store_inspection', { target: id })
    inspection.value = (ins as unknown as typeof inspection.value) ?? null
    loaded.value = true
  }

  // Create the application on first save, update it after
  async function write(patch: Partial<ApplicationRow>): Promise<string | null> {
    const id = await storeUuid()
    if (!id) return 'Your store isn\'t loaded. Refresh the page and try again.'
    const { data, error } = app.value
      ? await supabase.from('store_applications').update(patch as never).eq('store_id', id).select('*').maybeSingle()
      : await supabase.from('store_applications').insert({ store_id: id, ...patch } as never).select('*').maybeSingle()
    if (error || !data) return 'That didn\'t save. Applications can only change while the store is a draft.'
    app.value = data
    return null
  }

  const save = (v: ApplicationValues) => write(applicationToRow(v))

  // A document: uploaded into the store's private folder, then saved on the application; the old file goes
  async function uploadDoc(kind: DocKind, file: File): Promise<string | null> {
    if (!DOC_TYPES.includes(file.type)) return 'Use a PDF, or a JPG, PNG or WebP photo.'
    if (file.size > DOC_MAX_MB * 1024 * 1024) return `That file is over ${DOC_MAX_MB} MB. Try a smaller scan.`
    const id = await storeUuid()
    if (!id) return 'Your store isn\'t loaded. Refresh the page and try again.'
    const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1]!.replace('jpeg', 'jpg')
    const path = `${id}/${kind}-${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('store-documents').upload(path, file, { contentType: file.type })
    if (error) return 'The file didn\'t upload. Check your connection and try again.'
    const column = docKinds.find(d => d.key === kind)!.column
    const old = app.value?.[column]
    const saved = await write({ [column]: path })
    if (saved) return saved
    if (old) await supabase.storage.from('store-documents').remove([old])
    return null
  }

  // Documents are private: open one through a link that works for a minute
  async function openDoc(path: string) {
    const { data } = await supabase.storage.from('store-documents').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function submit(): Promise<string | null> {
    const id = await storeUuid()
    if (!id) return 'Your store isn\'t loaded. Refresh the page and try again.'
    const { error } = await supabase.rpc('submit_store_application', { target: id })
    if (error) {
      const m = error.message
      if (m.includes('profile')) return 'Finish the store profile first: tagline, about and who runs it.'
      if (m.includes('dog')) return 'Add at least one dog first, so the inspector has something to inspect.'
      if (m.includes('address')) return 'Add the kennel\'s address and a phone for the inspector.'
      if (m.includes('inspection day')) return 'Choose at least one inspection day.'
      if (m.includes('ID')) return 'Upload the owner\'s ID.'
      if (m.includes('CAC')) return 'Upload the CAC certificate, or tick that the kennel isn\'t registered yet.'
      return 'The application didn\'t send. Try again.'
    }
    await Promise.all([load(), session.load()])
    useNotify().applicationSent(session.memberships.value[0]?.store.name ?? 'your store')
    return null
  }

  const locked = computed(() => !!app.value?.submitted_at && session.memberships.value[0]?.store.status !== 'draft')
  return { app, inspection, loaded, locked, load, save, uploadDoc, openDoc, submit }
}
