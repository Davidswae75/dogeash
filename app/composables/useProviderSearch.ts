import { computed, ref } from 'vue'
import type { CareType } from '~/utils/care'
import { careTypes, listedProviders, providerServices } from '~/utils/care'
import { useSession } from './useSession'

// Finding a Dogeash care provider in a short list (a dog's care team, booking care for a dog): a word that
// matches the name, a service, the city or areas, and a kind of care. Listings you manage are left out.
export function useProviderSearch() {
  const query = ref('')
  const kind = ref<CareType | ''>('')
  const { providers: mine } = useSession()
  const kinds = (Object.keys(careTypes) as CareType[]).map(k => ({ value: k, label: careTypes[k].label }))
  const results = computed(() => {
    const q = query.value.trim().toLowerCase()
    return listedProviders.value
      .filter(p => !mine.value.some(m => m.id === p.id))
      .filter(p => !kind.value || p.type === kind.value)
      .filter(p => !q || [p.name, p.city, p.areas, p.person ?? '', ...providerServices(p)].some(t => t.toLowerCase().includes(q)))
  })
  return { query, kind, kinds, results }
}
