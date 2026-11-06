import type { CareType } from '~/utils/care'
import { computed, ref } from 'vue'
import { useRoute } from '#imports' // nuxt
import { careTypes, listedProviders } from '~/utils/care'

// Search, filters and sort for the care directory. Reads ?type= and ?city= so links can land on a filtered view.
export function useCareDirectory() {
  const route = useRoute()
  const query = ref('')
  const type = ref<CareType | ''>(String(route.query.type ?? '') in careTypes ? route.query.type as CareType : '')
  const cities = ref<string[]>(route.query.city ? [String(route.query.city)] : [])
  const options = ref<string[]>([])
  const sort = ref<'rating' | 'reviews' | 'price' | 'name'>('rating')
  const sortOptions = [
    { value: 'rating', label: 'Highest rated' },
    { value: 'reviews', label: 'Most reviewed' },
    { value: 'price', label: 'Lowest price' },
    { value: 'name', label: 'Name, A to Z' },
  ] as const

  const cityOptions = [...new Set(listedProviders.value.map(p => p.city))].sort().map(c => ({ value: c, label: c }))
  const typeOptions = (Object.keys(careTypes) as CareType[])
    .filter(t => listedProviders.value.some(p => p.type === t))
    .map(t => ({ value: t, label: careTypes[t].label }))
  const trustOptions = [
    { value: 'verified', label: 'Checked by Dogeash' },
    { value: 'home', label: 'Home visits' },
  ]

  const providers = computed(() => {
    const q = query.value.trim().toLowerCase()
    const list = listedProviders.value.filter(p =>
      (!type.value || p.type === type.value)
      && (!cities.value.length || cities.value.includes(p.city))
      && (!options.value.includes('verified') || p.verified)
      && (!options.value.includes('home') || p.homeVisits)
      && (!q || [p.name, p.person, p.city, p.areas, careTypes[p.type].label, ...careTypes[p.type].services].some(v => v?.toLowerCase().includes(q))),
    )
    const by = {
      rating: (a: typeof list[number], b: typeof list[number]) => b.rating - a.rating,
      reviews: (a: typeof list[number], b: typeof list[number]) => b.reviews - a.reviews,
      price: (a: typeof list[number], b: typeof list[number]) => a.priceFrom - b.priceFrom,
      name: (a: typeof list[number], b: typeof list[number]) => a.name.localeCompare(b.name),
    }
    return [...list].sort(by[sort.value])
  })

  function clear() {
    query.value = ''
    type.value = ''
    cities.value = []
    options.value = []
  }

  return { query, type, cities, options, sort, sortOptions, cityOptions, typeOptions, trustOptions, providers, clear }
}
