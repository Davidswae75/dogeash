import type { CareType } from '~/utils/care'

// Search, filters and sort for the care directory. Reads ?type= and ?city= so links can land on a filtered view.
export function useCareDirectory() {
  const route = useRoute()
  const query = ref('')
  const type = ref<CareType | ''>(String(route.query.type ?? '') in careTypes ? route.query.type as CareType : '')
  const cities = ref<string[]>(route.query.city ? [String(route.query.city)] : [])
  const options = ref<string[]>([])
  const sort = ref<'rating' | 'reviews' | 'price' | 'name'>('rating')

  const cityOptions = [...new Set(sampleCareProviders.map(p => p.city))].sort().map(c => ({ value: c, label: c }))
  const typeOptions = (Object.keys(careTypes) as CareType[])
    .filter(t => sampleCareProviders.some(p => p.type === t))
    .map(t => ({ value: t, label: careTypes[t].label }))
  const trustOptions = [
    { value: 'verified', label: 'Checked by Dogeash' },
    { value: 'home', label: 'Home visits' },
  ]

  const providers = computed(() => {
    const q = query.value.trim().toLowerCase()
    const list = sampleCareProviders.filter(p =>
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

  return { query, type, cities, options, sort, cityOptions, typeOptions, trustOptions, providers, clear }
}
