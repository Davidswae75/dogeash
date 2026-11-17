<script setup lang="ts">
import type { PropertyType, ProtectionLevel } from '~/utils/protection'
import { Bell, BellRing, Search, SlidersHorizontal, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useCookie, useRoute, useRouter, useSeoMeta } from '#imports' // nuxt
import type { DataColumn } from '~/components/list/ListTable.vue'
import { useAccountGate } from '~/composables/useAccountGate'
import { useNotify } from '~/composables/useNotify'
import { useSavedSearches } from '~/composables/useSavedSearches'
import type { Dog } from '~/utils/dogs'
import { formatNaira, getStore, listedDogs } from '~/utils/dogs'
import type { SearchFilters } from '~/utils/searchFilters'
import { filtersFromQuery, filtersToQuery, matchesFilters, parseSearch } from '~/utils/searchFilters'
import { marketCities } from '~/utils/market'
import { propertyTypes, protectionLevels } from '~/utils/protection'

useSeoMeta({ title: 'Find a guard dog · Dogeash' })

const route = useRoute()
const router = useRouter()

// Filters start from the address (?level=3,4&city=Abuja) and keep it up to date, so a search can be shared or saved
const initial = filtersFromQuery(route.query)
// Typed in a search box (?q=Malinois Abuja, from Home): breeds, cities, levels, property kinds and "children"
// become filters; any other words stay as a text search on the name, breed, city and store
const typed = typeof route.query.q === 'string' && route.query.q.trim()
  ? parseSearch(route.query.q, { breeds: [...new Set(listedDogs.value.map(d => d.breed))], cities: marketCities() })
  : null
if (typed) {
  const t = typed.filters
  initial.property = [...new Set([...initial.property, ...t.property])]
  initial.level = [...new Set([...initial.level, ...t.level])]
  initial.city = [...new Set([...initial.city, ...t.city])]
  initial.breed = [...new Set([...initial.breed, ...t.breed])]
  initial.children = initial.children || t.children
}
const text = ref(typed?.rest ?? '')
const properties = ref<PropertyType[]>(initial.property)
const levels = ref<ProtectionLevel[]>(initial.level)
const cities = ref<string[]>(initial.city)
const household = ref<string[]>(initial.children ? ['children'] : [])
const breeds = ref<string[]>(initial.breed)

const filters = computed<SearchFilters>(() => ({ property: properties.value, level: levels.value, city: cities.value, breed: breeds.value, children: household.value.includes('children') }))
const syncAddress = () => router.replace({ query: { ...filtersToQuery(filters.value), ...(text.value ? { q: text.value } : {}) } })
watch([filters, text], syncAddress, { deep: true })
// The typed words are now filters: show them in the address as filters straight away
if (typed) syncAddress()


const matchesText = (dog: (typeof listedDogs.value)[number]) => {
  const words = text.value.toLowerCase().split(' ').filter(Boolean)
  const hay = [dog.name, dog.breed, dog.city, getStore(dog.storeId)?.name ?? ''].join(' ').toLowerCase()
  return words.every(w => hay.includes(w))
}
// The order, and grid (photos) or table (comparing), remembered on this device
type DogSort = 'recommended' | 'price-low' | 'price-high' | 'level'
const sort = ref<DogSort>('recommended')
const sortOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'level', label: 'Protection: highest first' },
] as const
const view = useCookie<'grid' | 'table'>('dogeash-dogs-view', { default: () => 'grid', maxAge: 60 * 60 * 24 * 365 })
// How many dogs one choice would show, with everything else as it is (the counts beside each filter)
type FilterGroup = 'property' | 'city' | 'breed' | 'children'
const countWith = (change: Partial<SearchFilters>) => listedDogs.value.filter(d => matchesFilters({ ...filters.value, ...change }, d) && matchesText(d)).length
const countFor = (group: FilterGroup, value: string) => countWith(
  group === 'property' ? { property: [value as PropertyType] } : group === 'city' ? { city: [value] } : group === 'breed' ? { breed: [value] } : { children: true },
)
const levelCount = (n: ProtectionLevel) => countWith({ level: [n] })
const breedList = [...new Set(listedDogs.value.map(d => d.breed))]
// Phones: the filters open in a sheet from the bottom
const filtersOpen = ref(false)

const dogs = computed(() => {
  const list = listedDogs.value.filter(dog => matchesFilters(filters.value, dog) && matchesText(dog))
  const by: Record<DogSort, ((a: Dog, b: Dog) => number) | null> = {
    'recommended': null,
    'price-low': (a, b) => a.priceNaira - b.priceNaira,
    'price-high': (a, b) => b.priceNaira - a.priceNaira,
    'level': (a, b) => b.level - a.level,
  }
  return by[sort.value] ? [...list].sort(by[sort.value]!) : list
})
const columns: DataColumn[] = [
  { key: 'name', label: 'Dog', mobile: 'title' },
  { key: 'breed', label: 'Breed', mobile: 'meta' },
  { key: 'level', label: 'Level', mobile: 'row' },
  { key: 'age', label: 'Age', mobile: 'row' },
  { key: 'store', label: 'Store and city', mobile: 'row' },
  { key: 'price', label: 'Price', align: 'right', mono: true, mobile: 'end' },
]
const openDog = (d: Dog) => router.push(`/dogs/${d.fileNo.toLowerCase()}`)
const dogKey = (d: Dog) => d.fileNo
const dogLabel = (d: Dog) => `${d.name}, ${d.breed}`
const levelName = (n: number) => protectionLevels[n as ProtectionLevel].name

// Save this search (needs an account; guests sign in and come back to it)
const savedSearches = useSavedSearches()
const notify = useNotify()
const alreadySaved = computed(() => !!savedSearches.find(filters.value))
const saving = ref(false)
const { guard: saveSearch } = useAccountGate({
  key: 'save-search',
  action: 'save this search',
  reason: 'We keep your searches in your account and tell you when a new dog matches.',
}, async () => {
  if (alreadySaved.value) return
  saving.value = true
  const error = await savedSearches.add(filters.value)
  saving.value = false
  if (error) notify.error({ kicker: 'Saved searches', title: 'Not saved', text: error })
  else notify.searchSaved()
})

// Every listing page states the search in words
const heading = computed(() => {
  if (properties.value.length !== 1) return 'Guard dogs'
  const label = propertyTypes.find(p => p.value === properties.value[0])!.label.toLowerCase()
  return `Guard dogs for ${label === 'business' ? 'a business' : label === 'estate' ? 'an estate' : `a ${label}`}`
})


// Every filter that's on, in words, each with its own ✕: so it's clear what the list is based on
const active = computed(() => [
  ...properties.value.map(v => ({ key: `p-${v}`, kind: 'Property', label: propertyTypes.find(p => p.value === v)!.label, remove: () => { properties.value = properties.value.filter(x => x !== v) } })),
  // A range of levels reads as one chip ("3–5"), a single level with its name
  ...(levels.value.length ? [(() => {
    const on = [...levels.value].sort()
    const range = on.length > 1 && on.every((l, i) => i === 0 || l === on[i - 1]! + 1)
    const label = on.length === 1 ? `${on[0]} · ${protectionLevels[on[0]!].name}` : range ? `${on[0]}–${on.at(-1)}` : on.join(', ')
    return { key: 'l', kind: 'Level', label, remove: () => { levels.value = [] } }
  })()] : []),
  ...cities.value.map(v => ({ key: `c-${v}`, kind: 'City', label: v, remove: () => { cities.value = cities.value.filter(x => x !== v) } })),
  ...breeds.value.map(v => ({ key: `b-${v}`, kind: 'Breed', label: v, remove: () => { breeds.value = breeds.value.filter(x => x !== v) } })),
  ...(household.value.includes('children') ? [{ key: 'h', kind: 'Household', label: 'Safe with children', remove: () => { household.value = [] } }] : []),
  ...(text.value ? [{ key: 't', kind: 'Matching', label: `“${text.value}”`, remove: () => { text.value = '' } }] : []),
])

function clearFilters() {
  properties.value = []
  levels.value = []
  cities.value = []
  household.value = []
  breeds.value = []
  text.value = ''
}
</script>

<template>
  <div class="mx-auto flex max-w-page flex-col gap-7 px-4 pt-7 pb-16 sm:px-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span class="text-xs leading-4 font-bold tracking-[.08em] text-ink-muted uppercase">{{ dogs.length }} {{ dogs.length === 1 ? 'dog' : 'dogs' }}</span>
        <h1 class="mt-1 mb-0 font-display text-[clamp(32px,4vw,44px)] leading-[1.05] font-extrabold font-stretch-expanded">{{ heading }}</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ClientOnly>
          <Button :variant="alreadySaved ? 'outline' : 'marigold'" size="sm" :loading="saving" :disabled="alreadySaved" @click="saveSearch">
            <component :is="alreadySaved ? BellRing : Bell" aria-hidden="true" />{{ alreadySaved ? 'Search saved' : 'Save this search' }}
          </Button>
        </ClientOnly>
        <SelectMenu v-model="sort" :options="sortOptions" aria-label="Order" class="h-9! w-[180px] border-line-strong bg-surface text-sm" />
        <ListViewSwitch v-model="view" class="[&_button]:h-9! [&_button]:w-9!" />
      </div>
    </div>

    <!-- Phones: one Filters button opens the filters in a sheet, with a button showing how many dogs they leave -->
    <Sheet v-model:open="filtersOpen">
      <SheetTrigger as-child>
        <Button variant="outline" class="h-11 w-full justify-between border-line-strong lg:hidden">
          <span class="flex items-center gap-2"><SlidersHorizontal aria-hidden="true" />Filters</span>
          <span v-if="active.length" class="grid h-6 min-w-6 place-items-center rounded-full bg-marigold px-1.5 font-mono text-xs font-bold text-on-marigold">{{ active.length }}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" class="max-h-[88dvh] gap-0 rounded-t-2xl border-line bg-surface p-0">
        <SheetHeader class="border-b border-line px-5 py-4">
          <SheetTitle class="font-display text-lg font-extrabold">Filters</SheetTitle>
          <SheetDescription class="sr-only">Choose what kind of dog you need</SheetDescription>
        </SheetHeader>
        <div class="overflow-y-auto px-5 py-5">
          <DogFilters v-model:properties="properties" v-model:levels="levels" v-model:cities-on="cities" v-model:breeds-on="breeds" v-model:household="household" :cities="marketCities()" :breeds="breedList" :count="countFor" :level-count="levelCount" />
        </div>
        <div class="flex gap-2 border-t border-line px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom,0px))]">
          <Button v-if="active.length" variant="ghost" class="h-11" @click="clearFilters">Clear all</Button>
          <Button variant="marigold" class="h-11 flex-1" @click="filtersOpen = false">Show {{ dogs.length }} {{ dogs.length === 1 ? 'dog' : 'dogs' }}</Button>
        </div>
      </SheetContent>
    </Sheet>

    <div class="grid gap-8 lg:grid-cols-[264px_minmax(0,1fr)]">
      <!-- Wide screens: stays in view while the dogs scroll, and scrolls itself if the window is too short for every filter -->
      <!-- Wide screens: stays in view while the dogs scroll, and scrolls itself if the window is too short -->
      <!-- Transparent, but padded: it scrolls itself, so its contents need room inside the edge or their outlines
           get cut off -->
      <aside class="hidden flex-col gap-6 p-1.5 lg:sticky lg:top-[calc(var(--header-height)+16px)] lg:flex lg:max-h-[calc(100dvh-var(--header-height)-32px)] lg:self-start lg:overflow-y-auto lg:[scrollbar-gutter:stable] lg:[scrollbar-width:thin]" aria-label="Filters">
        <DogFilters v-model:properties="properties" v-model:levels="levels" v-model:cities-on="cities" v-model:breeds-on="breeds" v-model:household="household" :cities="marketCities()" :breeds="breedList" :count="countFor" :level-count="levelCount" />
        <HelpPanel title="Not sure which level?" :icon="false" class="p-3.5">
          <NuxtLink to="/guide">Take the 2-minute match</NuxtLink>
        </HelpPanel>
      </aside>

      <div class="flex min-w-0 flex-col gap-4">
        <!-- What the dogs are filtered by: the count, then one pill per filter (kind and value), each removable -->
        <div v-if="active.length" class="flex flex-col gap-2.5 rounded-xl bg-surface px-4 py-3.5 ring-1 ring-line sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:px-5">
          <!-- Phones: the count and Clear all on one line, the pills under them -->
          <span class="flex shrink-0 items-center justify-between gap-2 text-sm text-ink-muted">
            <span class="flex items-center gap-2">
              <SlidersHorizontal class="size-4" aria-hidden="true" />
              <span><strong class="font-semibold text-ink tabular-nums">{{ dogs.length }}</strong> {{ dogs.length === 1 ? 'dog' : 'dogs' }} for</span>
            </span>
            <button v-if="active.length > 1" type="button" class="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[13px] font-bold text-ink underline decoration-marigold decoration-2 underline-offset-4 sm:hidden" @click="clearFilters">Clear all</button>
          </span>
          <ul class="m-0 flex min-w-0 flex-1 list-none flex-wrap items-center gap-2 p-0" aria-label="Filters on">
            <li v-for="f in active" :key="f.key" class="inline-flex h-8 items-center gap-1.5 rounded-full bg-marigold-soft pr-1 pl-3 text-[13px] whitespace-nowrap text-ink">
              <Search v-if="f.kind === 'Matching'" class="size-3.5 opacity-60" aria-hidden="true" />
              <span v-else class="text-[10px] font-bold tracking-[.08em] uppercase opacity-60">{{ f.kind }}</span>
              <span class="font-semibold">{{ f.label }}</span>
              <button type="button" class="grid size-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink/70 hover:bg-marigold/30 hover:text-ink" :aria-label="`Remove ${f.kind.toLowerCase()} ${f.label}`" @click="f.remove()"><X class="size-3.5" aria-hidden="true" /></button>
            </li>
          </ul>
          <button v-if="active.length > 1" type="button" class="ml-auto hidden shrink-0 cursor-pointer sm:inline border-0 bg-transparent p-0 text-[13px] font-bold text-ink underline decoration-marigold decoration-2 underline-offset-4" @click="clearFilters">Clear all</button>
        </div>

        <template v-if="dogs.length">
          <div v-if="view === 'grid'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 rise-stagger">
            <K9Card v-for="dog in dogs" :key="dog.fileNo" :dog="dog" />
          </div>
          <ListTable v-else :rows="dogs" :columns="columns" :row-key="dogKey" :row-label="dogLabel" min-width="640px" @open="openDog">
            <template #cell-name="{ row }">
              <span class="flex items-center gap-3">
                <img v-if="row.photo" :src="row.photo" alt="" class="size-11 shrink-0 rounded-lg object-cover">
                <span class="flex min-w-0 flex-col">
                  <strong class="truncate font-semibold">{{ row.name }}</strong>
                  <span class="flex items-center gap-1.5 text-xs text-ink-muted">{{ row.sex }}<span v-if="row.status === 'reserved'" class="rounded-full bg-ash-soft px-1.5 font-semibold">Reserved</span></span>
                </span>
              </span>
            </template>
            <template #cell-level="{ row }">
              <span class="grid size-6 place-items-center rounded-md bg-marigold font-mono text-xs font-bold text-on-marigold" :title="levelName(row.level)">{{ row.level }}</span>
            </template>
            <template #cell-breed="{ row }"><span class="whitespace-nowrap">{{ row.breed }}</span></template>
            <template #cell-age="{ row }"><span class="whitespace-nowrap">{{ row.age }}</span></template>
            <template #cell-store="{ row }"><span class="flex max-w-[170px] flex-col"><span class="truncate" :title="getStore(row.storeId)?.name">{{ getStore(row.storeId)?.name ?? '—' }}</span><span class="text-xs text-ink-muted">{{ row.city }}</span></span></template>
            <template #cell-price="{ row }"><strong class="font-display text-[15px] font-extrabold">{{ formatNaira(row.priceNaira) }}</strong></template>
          </ListTable>
        </template>
        <EmptyState v-else @clear="clearFilters" />
      </div>
    </div>
  </div>
</template>
