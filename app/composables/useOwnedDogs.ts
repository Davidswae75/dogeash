import { useState, useSupabaseClient } from '#imports'
import type { Database } from '~/types/database.types'
import type { OwnedDog, OwnedDogRecord, RecordKind } from '~/utils/myDogs'
import type { ProtectionLevel } from '~/utils/protection'
import { useSession } from './useSession'

// The signed-in person's dogs and their records (Supabase: owned_dogs, owned_dog_records; photos in the
// private owned-dog-photos bucket, opened with hour-long links). Loaded once and kept for the account
// area; every change returns an error message, or null when it worked.
export type DogDraft = Omit<OwnedDog, 'id' | 'records' | 'photo'>
export type RecordDraft = Omit<OwnedDogRecord, 'id'>

type DogRow = Database['public']['Tables']['owned_dogs']['Row'] & { owned_dog_records: Database['public']['Tables']['owned_dog_records']['Row'][] }

const BUCKET = 'owned-dog-photos'
const fromRecord = (r: Database['public']['Tables']['owned_dog_records']['Row']): OwnedDogRecord =>
  ({ id: r.id, kind: r.kind, title: r.title, doneOn: r.done_on, dueOn: r.due_on, byWhom: r.by_whom, note: r.note })
const fromRow = (r: DogRow, photo?: string): OwnedDog => ({
  id: r.id,
  name: r.name,
  breed: r.breed,
  sex: r.sex,
  bornOn: r.born_on,
  weightKg: r.weight_kg,
  microchip: r.microchip,
  level: r.level as ProtectionLevel | null,
  photoPath: r.photo_path,
  photo,
  cameFrom: r.came_from,
  gotOn: r.got_on,
  notes: r.notes,
  records: r.owned_dog_records.map(fromRecord),
})
const toRow = (d: DogDraft) => ({
  name: d.name.trim(),
  breed: d.breed,
  sex: d.sex,
  born_on: d.bornOn || null,
  weight_kg: d.weightKg,
  microchip: d.microchip.trim(),
  level: d.level,
  photo_path: d.photoPath,
  came_from: d.cameFrom.trim(),
  got_on: d.gotOn || null,
  notes: d.notes.trim(),
})
const toRecordRow = (r: RecordDraft) => ({ kind: r.kind as RecordKind, title: r.title.trim(), done_on: r.doneOn || null, due_on: r.dueOn || null, by_whom: r.byWhom.trim(), note: r.note.trim() })

export function useOwnedDogs() {
  const supabase = useSupabaseClient()
  const { user } = useSession()
  const dogs = useState<OwnedDog[]>('owned-dogs', () => [])
  const loaded = useState('owned-dogs-loaded', () => false)

  async function load() {
    if (!user.value) {
      dogs.value = []
      return
    }
    const { data } = await supabase.from('owned_dogs').select('*, owned_dog_records (*)').order('created_at')
    const rows = (data ?? []) as unknown as DogRow[]
    const paths = rows.map(r => r.photo_path).filter((p): p is string => !!p)
    const links = paths.length ? (await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)).data ?? [] : []
    const linkOf = (p: string | null) => links.find(l => l.path === p)?.signedUrl ?? undefined
    dogs.value = rows.map(r => fromRow(r, linkOf(r.photo_path)))
    loaded.value = true
  }
  const ensure = () => (loaded.value ? Promise.resolve() : load())
  const find = (id: string) => dogs.value.find(d => d.id === id)

  // A photo goes in the owner's own folder; returns its path, or an error
  async function uploadPhoto(file: File): Promise<{ path?: string, error?: string }> {
    if (!user.value) return { error: 'Sign in first.' }
    if (file.size > 5 * 1024 * 1024) return { error: 'That photo is over 5 MB. Choose a smaller one.' }
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${user.value.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
    return error ? { error: 'The photo didn\'t upload. Try again.' } : { path }
  }
  async function previewOf(path: string) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
    return data?.signedUrl
  }

  const dogError = (message: string) => (message.includes('20 dogs') ? 'You can keep up to 20 dogs here.' : message.includes('got_after_born') ? 'The date the dog came to you can\'t be before it was born.' : 'That didn\'t save. Try again.')

  // Add a dog, or change one; returns { id } or { error }
  async function save(draft: DogDraft, id?: string): Promise<{ id?: string, error?: string }> {
    const before = id ? find(id) : undefined
    const query = id
      ? supabase.from('owned_dogs').update(toRow(draft)).eq('id', id).select('id').single()
      : supabase.from('owned_dogs').insert(toRow(draft)).select('id').single()
    const { data, error } = await query
    if (error) return { error: dogError(error.message) }
    // A replaced photo is removed from storage
    if (before?.photoPath && before.photoPath !== draft.photoPath) await supabase.storage.from(BUCKET).remove([before.photoPath])
    await load()
    return { id: data.id }
  }

  async function remove(id: string): Promise<string | null> {
    const dog = find(id)
    const { error } = await supabase.from('owned_dogs').delete().eq('id', id)
    if (error) return 'That didn\'t work. Try again.'
    if (dog?.photoPath) await supabase.storage.from(BUCKET).remove([dog.photoPath])
    dogs.value = dogs.value.filter(d => d.id !== id)
    return null
  }

  // Records: add, change, remove. The dog's list updates in place.
  const patch = (dogId: string, records: (list: OwnedDogRecord[]) => OwnedDogRecord[]) =>
    (dogs.value = dogs.value.map(d => (d.id === dogId ? { ...d, records: records(d.records) } : d)))

  async function saveRecord(dogId: string, draft: RecordDraft, id?: string): Promise<string | null> {
    const row = toRecordRow(draft)
    const { data, error } = id
      ? await supabase.from('owned_dog_records').update(row).eq('id', id).select('*').single()
      : await supabase.from('owned_dog_records').insert({ ...row, owned_dog_id: dogId }).select('*').single()
    if (error) return recordError(error.message)
    const saved = fromRecord(data)
    patch(dogId, list => (id ? list.map(r => (r.id === id ? saved : r)) : [...list, saved]))
    return null
  }

  async function removeRecord(dogId: string, id: string): Promise<string | null> {
    const { error } = await supabase.from('owned_dog_records').delete().eq('id', id)
    if (error) return 'That didn\'t work. Try again.'
    patch(dogId, list => list.filter(r => r.id !== id))
    return null
  }

  // "Done": a reminder or due item is logged as done today and no longer due
  const markDone = (dogId: string, r: OwnedDogRecord) =>
    saveRecord(dogId, { ...r, doneOn: new Date().toISOString().slice(0, 10), dueOn: null }, r.id)

  return { dogs, loaded, load, ensure, find, uploadPhoto, previewOf, save, remove, saveRecord, removeRecord, markDone }
}

// The database's refusal of a record line, in words for the owner (the dates are checked there too)
export function recordError(message: string) {
  if (message.includes('full')) return 'This dog\'s record is full.'
  if (message.includes('due_after_done')) return 'The next date can\'t be before the date it was done.'
  if (message.includes('done_not_future')) return 'The date it was done can\'t be in the future.'
  return 'That didn\'t save. Try again.'
}
