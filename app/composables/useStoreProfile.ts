import { navigateTo, useRuntimeConfig, useSupabaseClient } from '#imports'
import type { StoreRow, VisitSettings } from '~/utils/stores'
import type { StoreFormValues } from '~/utils/storeForm'
import { listedStores, storeColumns, toStore } from '~/utils/stores'
import { storeFormToRow } from '~/utils/storeForm'
import { checkImage, imagePath } from '~/utils/imageUpload'
import { visitSettingsToRow } from '~/utils/storeSettings'
import { useNotify } from './useNotify'
import { useSession } from './useSession'
import { useStoreContext } from './useStoreContext'

// Saving the store profile of the store the dashboard is showing (Supabase: stores, and the store-media bucket).
// Owners and managers can save; the database keeps Dogeash's inspection record and reviews whatever is sent.
// The banner and logo save as soon as they're uploaded or removed. Each returns an error message, or null.
export type StoreImage = 'banner' | 'logo'

export function useStoreProfile() {
  const supabase = useSupabaseClient()
  const storageUrl = useRuntimeConfig().public.supabase.url as string
  const session = useSession()
  const { membership, storeUuid } = useStoreContext()

  // The dashboard and the public pages in this tab show the saved store straight away
  async function refresh(row: StoreRow) {
    await session.load()
    const saved = toStore(row, row.details.owner?.name ?? '', storageUrl)
    listedStores.value = listedStores.value.map(s => (s.id === saved.id ? saved : s))
    return saved
  }

  // Read the store again after a change made elsewhere (its care team, say)
  async function reload() {
    const store = membership.value?.store
    if (!store) return
    const { data } = await supabase.from('stores').select(storeColumns).eq('public_id', store.id).maybeSingle()
    if (data) await refresh(data as unknown as StoreRow)
  }

  // `quiet` skips the toast (each step of the profile saves as you go)
  async function save(values: StoreFormValues, quiet = false): Promise<string | null> {
    const store = membership.value?.store
    if (!store) return 'Your store isn\'t loaded. Refresh the page and try again.'
    const { data, error } = await supabase.from('stores').update(storeFormToRow(values)).eq('public_id', store.id).select(storeColumns).maybeSingle()
    if (error) return error.message.includes('check constraint') ? 'Something is too long. Shorten it and try again.' : 'That didn\'t save. Try again.'
    if (!data) return 'Only the store\'s owners and managers can edit its profile.'
    const saved = await refresh(data as unknown as StoreRow)
    if (!quiet) useNotify().storeUpdated(saved.name)
    return null
  }

  // Upload a new banner or logo (or remove it, with no file), then drop the old file
  async function setImage(kind: StoreImage, file: File | null): Promise<string | null> {
    const store = membership.value?.store
    const folder = await storeUuid()
    if (!store || !folder) return 'Your store isn\'t loaded. Refresh the page and try again.'
    const old = kind === 'banner' ? store.bannerPath : store.logoPath

    let path: string | null = null
    if (file) {
      const invalid = checkImage(file)
      if (invalid) return invalid
      path = imagePath(folder, file, `${kind}-`)
      const { error } = await supabase.storage.from('store-media').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
      if (error) return 'The image didn\'t upload. Check your connection and try again.'
    }

    const column = kind === 'banner' ? { banner_path: path } : { logo_path: path }
    const { data, error } = await supabase.from('stores').update(column).eq('public_id', store.id).select(storeColumns).maybeSingle()
    if (error || !data) {
      if (path) await supabase.storage.from('store-media').remove([path])
      return 'That didn\'t save. Only owners and managers can change the store\'s images.'
    }
    if (old) await supabase.storage.from('store-media').remove([old])
    const saved = await refresh(data as unknown as StoreRow)
    useNotify().storeUpdated(saved.name)
    return null
  }

  // When the store takes kennel visits, or pausing them
  async function saveVisits(settings: VisitSettings): Promise<string | null> {
    const store = membership.value?.store
    if (!store) return 'Your store isn\'t loaded. Refresh the page and try again.'
    const { data, error } = await supabase.from('stores').update(visitSettingsToRow(settings)).eq('public_id', store.id).select(storeColumns).maybeSingle()
    if (error || !data) return 'That didn\'t save. Try again.'
    await refresh(data as unknown as StoreRow)
    useNotify().storeUpdated(store.name, settings.paused ? 'Visits paused' : 'Visit times saved')
    return null
  }

  // Only a store still in draft can be deleted (by its owner); anything further along goes through Dogeash
  async function deleteDraft(): Promise<string | null> {
    const store = membership.value?.store
    if (!store) return 'Your store isn\'t loaded. Refresh the page and try again.'
    const { data, error } = await supabase.from('stores').delete().eq('public_id', store.id).select('public_id')
    if (error) return error.message.includes('foreign key') ? 'Delete the store\'s dogs first.' : 'That didn\'t work. Try again.'
    if (!data?.length) return 'Only a store still in draft can be deleted here. Contact Dogeash to close it.'
    await session.load()
    await navigateTo('/account')
    return null
  }

  return { save, setImage, reload, saveVisits, deleteDraft }
}
