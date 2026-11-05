import { ref } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import type { InspectionListItem, InspectionSheet } from '~/utils/inspections'
import { useAdmin } from './useAdmin'

// Admin › Inspections (Supabase: the admin_… inspection functions and the private inspection-photos bucket).
// Admins book, cancel and see every inspection; inspectors see and work their own. Photos are private:
// they show through links that last an hour. Each change returns an error message, or null when done.
export interface StaffMember { id: string, role: 'admin' | 'inspector', name: string }

const message = (m: string) =>
  m.includes('already has an inspection') ? 'This store already has an inspection booked.'
    : m.includes('from now on') ? 'Choose a time from now on.'
      : m.includes('Mark every check') ? 'Mark every check as passed or failed first.'
        : m.includes('summary') ? 'Write a summary for the store (at least a sentence): it\'s the reason they read.'
          : m.includes('finished') ? 'This inspection is already finished.'
            : m.includes('Staff only') ? 'Your one-time code has expired, or this isn\'t your inspection.'
              : 'That didn\'t work. Try again.'

export function useAdminInspections() {
  const supabase = useSupabaseClient()
  const list = useState<InspectionListItem[]>('admin-inspections', () => [])
  const staff = useState<StaffMember[]>('admin-staff', () => [])
  const loaded = useState('admin-inspections-loaded', () => false)

  async function load() {
    const { data } = await supabase.rpc('admin_inspections')
    list.value = (data as unknown as InspectionListItem[] | null) ?? []
    loaded.value = true
  }

  async function loadStaff() {
    const { data } = await supabase.rpc('admin_staff')
    staff.value = (data as unknown as StaffMember[] | null) ?? []
  }

  // `day` like 2026-11-10 and `time` like 10:00, in Lagos time (UTC+1, no daylight saving)
  async function schedule(storeId: string, day: string, time: string, inspector: string, note: string): Promise<string | null> {
    const at = `${day}T${time.padStart(5, '0')}:00+01:00`
    const { error } = await supabase.rpc('admin_schedule_inspection', { target: storeId, at, inspector, note })
    if (error) return message(error.message)
    await load()
    return null
  }

  async function cancel(id: string, note: string): Promise<string | null> {
    const { error } = await supabase.rpc('admin_cancel_inspection', { target: id, note })
    if (error) return message(error.message)
    await load()
    return null
  }

  // ── One inspection's sheet ──
  const sheet = ref<InspectionSheet | null>(null)
  const photoUrls = ref<Record<string, string>>({})

  async function open(id: string) {
    const { data, error } = await supabase.rpc('admin_inspection', { target: id })
    sheet.value = error ? null : (data as unknown as InspectionSheet)
    await signPhotos()
    return error ? message(error.message) : null
  }

  async function signPhotos() {
    const paths = (sheet.value?.photos ?? []).filter(p => !photoUrls.value[p])
    if (!paths.length) return
    const { data } = await supabase.storage.from('inspection-photos').createSignedUrls(paths, 3600)
    photoUrls.value = { ...photoUrls.value, ...Object.fromEntries((data ?? []).flatMap(d => (d.signedUrl && d.path ? [[d.path, d.signedUrl]] : []))) }
  }

  async function save(): Promise<string | null> {
    const s = sheet.value
    if (!s) return 'The inspection isn\'t loaded.'
    const { error } = await supabase.rpc('admin_save_inspection', { target: s.id, checklist: s.checklist as never, dogs: s.dogs as never, photos: s.photos, summary: s.summary })
    return error ? message(error.message) : null
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const s = sheet.value
    if (!s) return 'The inspection isn\'t loaded.'
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Use a JPG, PNG or WebP photo.'
    if (file.size > 10 * 1024 * 1024) return 'That photo is over 10 MB.'
    const path = `${s.id}/${crypto.randomUUID()}.${file.type.split('/')[1]!.replace('jpeg', 'jpg')}`
    const { error } = await supabase.storage.from('inspection-photos').upload(path, file, { contentType: file.type })
    if (error) return 'The photo didn\'t upload. Check your connection and try again.'
    photoUrls.value = { ...photoUrls.value, [path]: URL.createObjectURL(file) }
    s.photos = [...s.photos, path]
    return save()
  }

  async function removePhoto(path: string) {
    const s = sheet.value
    if (!s) return
    s.photos = s.photos.filter(p => p !== path)
    await save()
    await supabase.storage.from('inspection-photos').remove([path])
  }

  // Save the sheet, then record the result; the overview's counts reload
  async function complete(passed: boolean): Promise<string | null> {
    const s = sheet.value
    if (!s) return 'The inspection isn\'t loaded.'
    const saved = await save()
    if (saved) return saved
    const { error } = await supabase.rpc('admin_complete_inspection', { target: s.id, passed })
    if (error) return message(error.message)
    await Promise.all([open(s.id), useAdmin().loadOverview()])
    return null
  }

  return { list, staff, loaded, load, loadStaff, schedule, cancel, sheet, photoUrls, open, save, uploadPhoto, removePhoto, complete }
}
