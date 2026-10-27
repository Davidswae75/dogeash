import { createGlobalState } from '@vueuse/core'
import type { Dog } from '~/utils/dogs'

// The buyer's shortlist: dogs they're considering, and up to three picked to compare.
// One shared instance for the whole app, kept per person (guest or account) in this browser.
export const useShortlist = createGlobalState(() => {
  const fileNos = useAccountList('shortlist')
  const compareNos = useAccountList('compare')

  const dogs = computed(() => fileNos.value.map(findDog).filter((d): d is Dog => !!d))
  const count = computed(() => dogs.value.length)

  // Shortlisted dogs grouped by the store that sells them, in shortlist order
  const byStore = computed(() => {
    const groups = new Map<string, Dog[]>()
    for (const dog of dogs.value) groups.set(dog.storeId, [...(groups.get(dog.storeId) ?? []), dog])
    return [...groups].map(([storeId, list]) => ({ store: getStore(storeId)!, dogs: list })).filter(g => g.store)
  })

  const has = (fileNo: string) => fileNos.value.includes(fileNo)

  function toggle(fileNo: string) {
    if (has(fileNo)) remove(fileNo)
    else fileNos.value = [fileNo, ...fileNos.value]
  }

  // Returns an undo that puts the dog back where it was, compare tick included
  function remove(fileNo: string) {
    const before = { list: fileNos.value, compare: compareNos.value }
    fileNos.value = fileNos.value.filter(f => f !== fileNo)
    compareNos.value = compareNos.value.filter(f => f !== fileNo)
    return () => {
      fileNos.value = before.list
      compareNos.value = before.compare
    }
  }

  const comparing = (fileNo: string) => compareNos.value.includes(fileNo)
  const canCompareMore = computed(() => compareNos.value.length < COMPARE_MAX)

  // False when the compare list is already full
  function toggleCompare(fileNo: string) {
    if (comparing(fileNo)) compareNos.value = compareNos.value.filter(f => f !== fileNo)
    else if (canCompareMore.value) compareNos.value = [...compareNos.value, fileNo]
    else return false
    return true
  }

  const compareDogs = computed(() => compareNos.value.map(findDog).filter((d): d is Dog => !!d))

  return { dogs, count, byStore, has, toggle, remove, comparing, canCompareMore, toggleCompare, compareDogs }
})
