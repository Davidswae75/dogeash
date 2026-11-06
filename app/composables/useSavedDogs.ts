import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import { takeGuestList, useAccountList } from './useAccountList'
import { useNotify } from './useNotify'
import { useSession } from './useSession'

// The shortlist and compare picks behind useShortlist(). Signed in: the shortlist_items table in
// Supabase, so saved dogs follow you to any device. Guests: this browser (useAccountList).
// Changes show at once and are written in the background; if the database refuses, the list is
// reloaded from Supabase and the person is told.
interface Saved { fileNo: string, comparing: boolean, savedPrice?: number | null }

export function useSavedDogs() {
  const supabase = useSupabaseClient()
  const { user } = useSession()

  // null until loaded for the signed-in person
  const remote = useState<Saved[] | null>('saved-dogs', () => null)
  // Dog file number ↔ database id (shortlist_items stores the id)
  const dogIds = useState<Record<string, string>>('saved-dogs-ids', () => ({}))
  const localList = useAccountList('shortlist')
  const localCompare = useAccountList('compare')
  const signedIn = computed(() => !!user.value)

  async function ensureIds(fileNos: string[]) {
    const missing = fileNos.filter(f => !dogIds.value[f])
    if (!missing.length) return
    const { data } = await supabase.from('dogs').select('id, file_no').in('file_no', missing)
    dogIds.value = { ...dogIds.value, ...Object.fromEntries((data ?? []).map(d => [d.file_no, d.id])) }
  }

  async function load() {
    if (!user.value) return (remote.value = null)
    const { data, error } = await supabase
      .from('shortlist_items')
      .select('dog_id, comparing, saved_price, dogs (file_no)')
      .order('created_at', { ascending: false })
    if (error) return
    const rows = (data ?? []).filter(r => r.dogs)
    dogIds.value = { ...dogIds.value, ...Object.fromEntries(rows.map(r => [r.dogs!.file_no, r.dog_id])) }
    remote.value = rows.map(r => ({ fileNo: r.dogs!.file_no, comparing: r.comparing, savedPrice: r.saved_price }))
  }

  // Write the difference between what's saved and what should be, in the background
  async function apply(nextList: string[], nextCompare: string[]) {
    const uid = user.value?.id
    if (!uid) return
    const before = remote.value ?? []
    const next = nextList.map(fileNo => ({ fileNo, comparing: nextCompare.includes(fileNo), savedPrice: before.find(b => b.fileNo === fileNo)?.savedPrice }))
    remote.value = next

    const added = next.filter(n => !before.some(b => b.fileNo === n.fileNo))
    const removed = before.filter(b => !next.some(n => n.fileNo === b.fileNo))
    const flipped = next.filter(n => before.some(b => b.fileNo === n.fileNo && b.comparing !== n.comparing))
    await ensureIds([...added, ...flipped].map(s => s.fileNo))
    const id = (fileNo: string) => dogIds.value[fileNo]!

    const results = await Promise.all([
      added.length
        ? supabase.from('shortlist_items').upsert(added.map(s => ({ user_id: uid, dog_id: id(s.fileNo), comparing: s.comparing })), { onConflict: 'user_id,dog_id', ignoreDuplicates: true })
        : null,
      removed.length
        ? supabase.from('shortlist_items').delete().eq('user_id', uid).in('dog_id', removed.map(s => id(s.fileNo)))
        : null,
      ...flipped.map(s => supabase.from('shortlist_items').update({ comparing: s.comparing }).eq('user_id', uid).eq('dog_id', id(s.fileNo))),
    ])
    if (results.some(r => r?.error)) {
      // Fetched here, not at the top: useNotify reads the shortlist, which is built from this
      useNotify().error({ kicker: 'Shortlist', title: 'Not saved', text: 'Your shortlist couldn\'t be updated. It\'s been put back as it was.' })
      await load()
    }
  }

  const fileNos = computed<string[]>({
    get: () => (signedIn.value ? (remote.value ?? []).map(s => s.fileNo) : localList.value),
    set: (list) => {
      if (!signedIn.value) return (localList.value = list)
      apply(list, (remote.value ?? []).filter(s => s.comparing && list.includes(s.fileNo)).map(s => s.fileNo))
    },
  })

  const compareNos = computed<string[]>({
    get: () => (signedIn.value ? (remote.value ?? []).filter(s => s.comparing).map(s => s.fileNo) : localCompare.value),
    set: (list) => {
      if (!signedIn.value) return (localCompare.value = list)
      apply((remote.value ?? []).map(s => s.fileNo), list)
    },
  })

  // On sign-in: the guest's saved dogs (and compare ticks) join the account in Supabase.
  // Returns how many dogs were new to the account.
  async function adoptGuest() {
    const guestList = takeGuestList('shortlist')
    const guestCompare = takeGuestList('compare')
    await load()
    const current = remote.value ?? []
    const fresh = guestList.filter(f => !current.some(s => s.fileNo === f))
    if (!fresh.length) return 0
    await apply(
      [...fresh, ...current.map(s => s.fileNo)],
      [...current.filter(s => s.comparing).map(s => s.fileNo), ...guestCompare.filter(f => fresh.includes(f))],
    )
    return fresh.length
  }

  // What each shortlisted dog cost when it was saved (signed in only), for "price dropped"
  const savedPrices = computed<Record<string, number>>(() => Object.fromEntries((remote.value ?? []).filter(r => r.savedPrice).map(r => [r.fileNo, r.savedPrice!])))

  return { fileNos, compareNos, savedPrices, load, adoptGuest }
}
