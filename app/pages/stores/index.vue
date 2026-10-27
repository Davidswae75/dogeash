<script setup lang="ts">
import { ClipboardCheck, Cpu, FileHeart, Gauge, Search, SlidersHorizontal, X } from '@lucide/vue'
import type { ProtectionLevel } from '~/utils/protection'
import type { StoreService } from '~/utils/stores'

useSeoMeta({
  title: 'Guard dog stores · Dogeash',
  description: 'Inspected kennels with trained guard dogs in Nigeria. Every store is inspected in person before its dogs are listed.',
})

const route = useRoute()

const query = ref('')
const city = ref<string>(route.query.city ? String(route.query.city) : '')
const breeds = ref<string[]>([])
const levels = ref<ProtectionLevel[]>([])
const services = ref<StoreService[]>([])
const trust = ref<string[]>([])
const sort = ref<'rating' | 'available' | 'established' | 'name'>('rating')
const sheetOpen = ref(false)

const summaries = new Map(sampleStores.map(s => [s.id, storeSummary(s)]))

// A store shows up for every city it has dogs in, not only its home city
const cityTabs = [...new Set([...summaries.values()].flatMap(s => s.cities))].sort()
const breedOptions = [...new Set(sampleDogs.map(d => d.breed))].sort().map(b => ({ value: b, label: b }))
const levelOptions = ([1, 2, 3, 4, 5] as const).map(n => ({ value: n, label: String(n) }))
const serviceOptions = (Object.keys(storeServices) as StoreService[]).map(s => ({ value: s, label: storeServices[s].label }))
const trustOptions = [
  { value: 'verified', label: 'Inspected stores only' },
  { value: 'available', label: 'Has dogs for sale now' },
]

function matches(storeId: string, skipCity = false) {
  const store = sampleStores.find(s => s.id === storeId)!
  const s = summaries.get(storeId)!
  const q = query.value.trim().toLowerCase()
  const haystack = [store.name, store.owner.name, store.city, store.area, store.tagline, ...s.breeds].join(' ').toLowerCase()
  return (!q || haystack.includes(q))
    && (skipCity || !city.value || s.cities.includes(city.value))
    && (!breeds.value.length || breeds.value.some(b => s.breeds.includes(b)))
    && (!levels.value.length || levels.value.some(l => s.levels.includes(l)))
    && (!services.value.length || services.value.every(sv => store.services.includes(sv)))
    && (!trust.value.includes('verified') || store.verified)
    && (!trust.value.includes('available') || s.available > 0)
}

const stores = computed(() => {
  const list = sampleStores.filter(s => matches(s.id))
  const by: Record<typeof sort.value, (a: typeof list[number], b: typeof list[number]) => number> = {
    rating: (a, b) => b.rating - a.rating,
    available: (a, b) => summaries.get(b.id)!.available - summaries.get(a.id)!.available,
    established: (a, b) => a.founded - b.founded,
    name: (a, b) => a.name.localeCompare(b.name),
  }
  return [...list].sort(by[sort.value])
})

// How many stores each city tab would show with the other filters applied
const cityCounts = computed(() => Object.fromEntries(
  ['', ...cityTabs].map(c => [c, sampleStores.filter(s => matches(s.id, true) && (!c || summaries.get(s.id)!.cities.includes(c))).length]),
))

const sheetCount = computed(() => breeds.value.length + levels.value.length + services.value.length + trust.value.length)

// Every active filter as a removable pill
const pills = computed(() => [
  ...breeds.value.map(v => ({ key: `b-${v}`, label: v, remove: () => (breeds.value = breeds.value.filter(x => x !== v)) })),
  ...levels.value.map(v => ({ key: `l-${v}`, label: `Level ${v}`, remove: () => (levels.value = levels.value.filter(x => x !== v)) })),
  ...services.value.map(v => ({ key: `s-${v}`, label: storeServices[v].label, remove: () => (services.value = services.value.filter(x => x !== v)) })),
  ...trust.value.map(v => ({ key: `t-${v}`, label: trustOptions.find(o => o.value === v)!.label, remove: () => (trust.value = trust.value.filter(x => x !== v)) })),
])

function resetSheet() {
  breeds.value = []
  levels.value = []
  services.value = []
  trust.value = []
}

function clearFilters() {
  query.value = ''
  city.value = ''
  resetSheet()
}

const inspectedCount = sampleStores.filter(s => s.verified).length
const dogCount = sampleDogs.filter(d => d.status === 'available').length

const checks = [
  { icon: ClipboardCheck, label: 'Visited in person' },
  { icon: FileHeart, label: 'Vet records checked' },
  { icon: Gauge, label: 'Protection levels tested' },
  { icon: Cpu, label: 'Microchips matched' },
]

const eyebrow = 'text-xs leading-4 font-bold tracking-[.08em] uppercase'
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col px-4 pt-8 sm:px-8 sm:pt-12">
    <!-- Intro -->
    <header class="grid items-end gap-8 pb-10 lg:grid-cols-[1.1fr_1fr]">
      <div class="flex animate-rise flex-col gap-4">
        <span :class="[eyebrow, 'text-ink-muted']">{{ inspectedCount }} inspected stores · {{ dogCount }} dogs for sale</span>
        <h1 class="m-0 mega text-[clamp(38px,4.6vw,64px)] leading-[.95]">Guard dog <span class="text-outline">stores</span></h1>
        <p class="m-0 max-w-[30em] text-[17px] leading-[27px] text-ink-muted">Kennels we have visited in person. Open one to meet its dogs, its owner and the vets who look after them.</p>
      </div>
      <div class="flex animate-rise flex-col gap-4 [animation-delay:80ms]">
        <label for="store-search" class="flex items-center gap-3 rounded-full border-2 border-ink bg-surface px-5 py-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
          <Search class="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
          <span class="sr-only">Search stores</span>
          <input id="store-search" v-model="query" type="search" placeholder="Store, owner or breed" class="min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-ink outline-none placeholder:text-ink-muted">
        </label>
        <ul class="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[13px] text-ink-muted">
          <li v-for="check in checks" :key="check.label" class="inline-flex items-center gap-1.5">
            <component :is="check.icon" class="size-4 text-marigold-ink" aria-hidden="true" />{{ check.label }}
          </li>
        </ul>
      </div>
    </header>

    <!-- Toolbar: city tabs, filters, sort -->
    <div class="sticky top-[calc(var(--header-height)+env(safe-area-inset-top,0px))] z-10 -mx-4 bg-canvas px-4 sm:-mx-8 sm:px-8">
      <div class="flex items-center gap-3 border-b border-line">
        <nav aria-label="City" class="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
          <button
            v-for="c in ['', ...cityTabs]"
            :key="c || 'all'"
            type="button"
            :aria-pressed="city === c"
            :class="[
              'shrink-0 cursor-pointer border-0 border-b-[3px] bg-transparent px-3 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
              city === c ? 'border-marigold text-ink' : 'border-transparent text-ink-muted hover:text-ink',
            ]"
            @click="city = c"
          >
            {{ c || 'All cities' }}
            <span class="ml-1 font-mono text-[11px] text-ink-muted">{{ cityCounts[c] }}</span>
          </button>
        </nav>

        <Sheet v-model:open="sheetOpen">
          <SheetTrigger as-child>
            <Button variant="outline" size="sm" class="shrink-0">
              <SlidersHorizontal aria-hidden="true" />Filters
              <span v-if="sheetCount" class="grid size-5 place-items-center rounded-full bg-marigold text-[11px] text-on-marigold">{{ sheetCount }}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" class="w-full gap-0 border-line bg-canvas p-0 sm:max-w-[400px]">
            <SheetHeader class="border-b border-line px-6 py-5">
              <SheetTitle class="font-display text-xl font-extrabold font-stretch-expanded">Filter stores</SheetTitle>
              <SheetDescription class="text-ink-muted">Narrow the list to stores that fit your home.</SheetDescription>
            </SheetHeader>
            <div class="flex flex-1 flex-col gap-7 overflow-y-auto px-6 py-6">
              <div class="flex flex-col gap-2.5">
                <span :class="[eyebrow, 'text-ink-muted']">Breeds they keep</span>
                <FilterChips v-model="breeds" :options="breedOptions" label="Breed" />
              </div>
              <div class="flex flex-col gap-2.5">
                <span :class="[eyebrow, 'text-ink-muted']">Protection levels</span>
                <FilterChips v-model="levels" :options="levelOptions" label="Protection level" class="gap-1.5" item-class="w-10 justify-center px-0" />
              </div>
              <div class="flex flex-col gap-2.5">
                <span :class="[eyebrow, 'text-ink-muted']">Services</span>
                <FilterChips v-model="services" :options="serviceOptions" label="Services" />
              </div>
              <div class="flex flex-col gap-2.5">
                <span :class="[eyebrow, 'text-ink-muted']">Trust</span>
                <FilterChips v-model="trust" :options="trustOptions" label="Trust" />
              </div>
              <div class="flex flex-col gap-2.5 md:hidden">
                <label for="store-sort" :class="[eyebrow, 'text-ink-muted']">Sort by</label>
                <NativeSelect id="store-sort" v-model="sort" class="h-10 w-full border-line-strong bg-surface font-semibold">
                  <NativeSelectOption value="rating">Highest rated</NativeSelectOption>
                  <NativeSelectOption value="available">Most dogs for sale</NativeSelectOption>
                  <NativeSelectOption value="established">Longest running</NativeSelectOption>
                  <NativeSelectOption value="name">Name, A to Z</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>
            <SheetFooter class="flex-row gap-2 border-t border-line px-6 py-4">
              <Button variant="ghost" class="flex-1" @click="resetSheet">Reset</Button>
              <SheetClose as-child>
                <Button class="flex-[2]">Show {{ stores.length }} {{ stores.length === 1 ? 'store' : 'stores' }}</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <label class="hidden shrink-0 items-center gap-2 text-sm md:flex">
          <span class="sr-only">Sort by</span>
          <NativeSelect v-model="sort" class="h-[38px] border-line-strong bg-surface font-semibold">
            <NativeSelectOption value="rating">Highest rated</NativeSelectOption>
            <NativeSelectOption value="available">Most dogs for sale</NativeSelectOption>
            <NativeSelectOption value="established">Longest running</NativeSelectOption>
            <NativeSelectOption value="name">Name, A to Z</NativeSelectOption>
          </NativeSelect>
        </label>
      </div>
    </div>

    <!-- Active filters -->
    <div class="flex min-h-14 flex-wrap items-center gap-2 py-4">
      <p class="m-0 mr-2 text-sm" aria-live="polite"><strong>{{ stores.length }}</strong> {{ stores.length === 1 ? 'store' : 'stores' }}<template v-if="city"> in {{ city }}</template></p>
      <TransitionGroup
        enter-active-class="transition duration-200 ease-calm"
        enter-from-class="scale-90 opacity-0"
        leave-active-class="transition duration-150"
        leave-to-class="scale-90 opacity-0"
      >
        <button
          v-for="pill in pills"
          :key="pill.key"
          type="button"
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-ink py-1.5 pr-2 pl-3 text-xs font-semibold text-canvas"
          :aria-label="`Remove ${pill.label}`"
          @click="pill.remove()"
        >
          {{ pill.label }}<X class="size-3.5" aria-hidden="true" />
        </button>
      </TransitionGroup>
      <button v-if="pills.length || city || query" type="button" class="cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-ink underline underline-offset-4" @click="clearFilters">Clear all</button>
    </div>

    <!-- Results -->
    <TransitionGroup
      v-if="stores.length"
      tag="div"
      class="relative grid grid-cols-1 gap-6 pb-8 lg:grid-cols-2"
      move-class="transition-transform duration-500 ease-calm"
      enter-active-class="transition duration-500 ease-calm"
      enter-from-class="translate-y-4 opacity-0"
      leave-active-class="hidden"
    >
      <StoreTile v-for="store in stores" :key="store.id" :store="store" />
    </TransitionGroup>
    <EmptyState
      v-else
      title="No stores match all of those"
      text="Try another city or fewer filters. New stores join after each inspection round."
      @clear="clearFilters"
    />
  </div>
</template>
