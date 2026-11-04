import { computed } from 'vue'
import { useRuntimeConfig, useState, useSupabaseClient } from '#imports'
import type { DogRow, StoreDog } from '~/utils/dogs'
import type { ListingStatus } from '~/utils/k9'
import type { DogFormValues } from '~/utils/dogForm'
import { dogColumns, listingStatusLabels, toStoreDog } from '~/utils/dogs'
import { dogFormToRow } from '~/utils/dogForm'
import { checkImage, imagePath } from '~/utils/imageUpload'
import { useNotify } from './useNotify'
import { useStoreContext } from './useStoreContext'

// The dogs of the store the dashboard is showing (Supabase: dogs, and the dog-photos bucket).
// A store's people see every dog of theirs, drafts included; the public sees only live ones.
// Errors come back as friendly messages, or null when it worked.

export function useStoreDogs() {
  const supabase = useSupabaseClient()
  const storageUrl = useRuntimeConfig().public.supabase.url as string
  const { membership, storeUuid: storeId } = useStoreContext()
  const dogs = useState<StoreDog[]>('store-dogs', () => [])
  const loaded = useState('store-dogs-loaded', () => false)

  const store = computed(() => membership.value?.store)
  const verified = computed(() => !!store.value?.verified)

  async function load() {
    if (!store.value) return (dogs.value = [])
    const { data } = await supabase.from('dogs').select(dogColumns).eq('stores.public_id', store.value.id).order('updated_at', { ascending: false })
    dogs.value = ((data ?? []) as unknown as DogRow[]).map(r => toStoreDog(r, storageUrl))
    loaded.value = true
  }

  const find = (fileNo: string) => dogs.value.find(d => d.fileNo.toLowerCase() === fileNo.toLowerCase())

  // A photo goes in the store's own folder under a fresh name, so replacing one never breaks a cached page
  async function uploadPhoto(file: File): Promise<{ path?: string, error?: string }> {
    const invalid = checkImage(file)
    if (invalid) return { error: invalid }
    const id = await storeId()
    if (!id) return { error: 'Your store wasn\'t found. Reload and try again.' }
    const path = imagePath(id, file)
    const { error } = await supabase.storage.from('dog-photos').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
    return error ? { error: 'The photo didn\'t upload. Check your connection and try again.' } : { path }
  }

  async function removePhoto(path: string | null) {
    if (path && !path.startsWith('dogs/')) await supabase.storage.from('dog-photos').remove([path])
  }

  // New dogs start as drafts; `publish` lists it straight away when the store is verified
  async function create(values: DogFormValues, photoPath: string | null, publish: boolean): Promise<{ fileNo?: string, error?: string }> {
    const id = await storeId()
    if (!id) return { error: 'Your store wasn\'t found. Reload and try again.' }
    const { data, error } = await supabase.from('dogs').insert({ ...dogFormToRow(values, photoPath), store_id: id, status: 'draft' } as never).select('id, file_no').single()
    if (error || !data) return { error: 'The dog didn\'t save. Check the form and try again.' }
    if (publish) {
      const failed = await setStatus(data.id, 'available')
      if (failed) return { fileNo: data.file_no, error: failed }
    }
    await load()
    return { fileNo: data.file_no }
  }

  async function update(dog: StoreDog, values: DogFormValues, photoPath: string | null): Promise<string | null> {
    const { error } = await supabase.from('dogs').update(dogFormToRow(values, photoPath)).eq('id', dog.id)
    if (error) return 'Your changes didn\'t save. Check the form and try again.'
    if (photoPath !== dog.photoPath) await removePhoto(dog.photoPath)
    await load()
    return null
  }

  async function setStatus(id: string, status: ListingStatus): Promise<string | null> {
    const { error } = await supabase.from('dogs').update({ status }).eq('id', id)
    if (error) return status === 'available' && !verified.value ? 'Dogs go live once your store has passed its inspection.' : 'That didn\'t save. Try again.'
    dogs.value = dogs.value.map(d => (d.id === id ? { ...d, status } : d))
    return null
  }

  // Only drafts can be deleted (by owners and managers); anything buyers may have seen is withdrawn instead
  async function remove(dog: StoreDog): Promise<string | null> {
    const { data, error } = await supabase.from('dogs').delete().eq('id', dog.id).select('id')
    if (error || !data?.length) return 'Only owners and managers can delete a draft.'
    await removePhoto(dog.photoPath)
    dogs.value = dogs.value.filter(d => d.id !== dog.id)
    return null
  }

  // The same, with a toast either way, for the list's ⋯ menu
  const moved: Partial<Record<ListingStatus, string>> = { available: 'is live', reserved: 'is marked reserved', sold: 'is marked sold', withdrawn: 'is withdrawn' }
  async function changeStatus(dog: StoreDog, to: ListingStatus) {
    const error = await setStatus(dog.id, to)
    const notify = useNotify()
    if (error) return notify.failed(error)
    notify.dogUpdated(`${dog.name} ${moved[to] ?? 'is updated'}`, `${dog.fileNo} · ${listingStatusLabels[to].label}. ${to === 'available' ? 'Buyers can see it now.' : to === 'withdrawn' ? 'Hidden from buyers; you can list it again later.' : ''}`.trim(), dog.photo)
  }
  async function deleteDraft(dog: StoreDog) {
    const error = await remove(dog)
    const notify = useNotify()
    if (error) return notify.failed(error)
    notify.dogUpdated(`${dog.name} deleted`, 'The draft and its photo are gone.')
  }

  return { dogs, loaded, verified, load, find, uploadPhoto, create, update, setStatus, remove, changeStatus, deleteDraft }
}
