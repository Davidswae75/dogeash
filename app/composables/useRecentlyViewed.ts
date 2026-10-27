import type { Dog } from '~/utils/dogs'

// Dogs this person has opened, newest first (kept to 12 by useAccountList)

export function useRecentlyViewed() {
  const fileNos = useAccountList('recently-viewed')

  function add(fileNo: string) {
    fileNos.value = [fileNo, ...fileNos.value.filter(f => f !== fileNo)]
  }

  const dogs = computed(() => fileNos.value.map(f => findDog(f)).filter((d): d is Dog => !!d))

  return { dogs, add }
}
