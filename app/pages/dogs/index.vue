<script setup lang="ts">
import type { PropertyType, ProtectionLevel } from '~/utils/protection'
import { Bell, BellRing } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, useSeoMeta } from '#imports' // nuxt
import { useAccountGate } from '~/composables/useAccountGate'
import { useNotify } from '~/composables/useNotify'
import { useSavedSearches } from '~/composables/useSavedSearches'
import { listedDogs } from '~/utils/dogs'
import type { SearchFilters } from '~/utils/searchFilters'
import { filtersFromQuery, filtersToQuery, matchesFilters } from '~/utils/searchFilters'
import { marketCities } from '~/utils/market'
import { propertyTypes, protectionLevels } from '~/utils/protection'

useSeoMeta({ title: 'Find a guard dog · Dogeash' })

const route = useRoute()
const router = useRouter()

// Filters start from the address (?level=3,4&city=Abuja) and keep it up to date, so a search can be shared or saved
const initial = filtersFromQuery(route.query)
const properties = ref<PropertyType[]>(initial.property)
const levels = ref<ProtectionLevel[]>(initial.level)
const cities = ref<string[]>(initial.city)
const household = ref<string[]>(initial.children ? ['children'] : [])
const breeds = ref<string[]>(initial.breed)

const filters = computed<SearchFilters>(() => ({ property: properties.value, level: levels.value, city: cities.value, breed: breeds.value, children: household.value.includes('children') }))
watch(filters, f => router.replace({ query: filtersToQuery(f) }), { deep: true })

const propertyOptions = propertyTypes.map(p => ({ value: p.value, label: p.label }))
const levelOptions = ([1, 2, 3, 4, 5] as const).map(n => ({ value: n, label: String(n) }))
const cityOptions = marketCities().map(c => ({ value: c, label: c }))
const householdOptions = [{ value: 'children', label: 'Safe with children' }]
const breedOptions = [...new Set(listedDogs.value.map(d => d.breed))].map(b => ({ value: b, label: b }))

const dogs = computed(() => listedDogs.value.filter(dog => matchesFilters(filters.value, dog)))

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

const levelSummary = computed(() => [...levels.value].sort().map(n => `${n} ${protectionLevels[n].name}`).join(' – '))

function clearFilters() {
  properties.value = []
  levels.value = []
  cities.value = []
  household.value = []
  breeds.value = []
}
</script>

<template>
  <div class="mx-auto flex max-w-page flex-col gap-7 px-4 pt-7 pb-16 sm:px-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span class="text-xs leading-4 font-bold tracking-[.08em] text-ink-muted uppercase">{{ dogs.length }} {{ dogs.length === 1 ? 'dog' : 'dogs' }}</span>
        <h1 class="mt-1 mb-0 font-display text-[clamp(32px,4vw,44px)] leading-[1.05] font-extrabold font-stretch-expanded">{{ heading }}</h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <ClientOnly>
          <Button :variant="alreadySaved ? 'outline' : 'marigold'" size="sm" :loading="saving" :disabled="alreadySaved" @click="saveSearch">
            <component :is="alreadySaved ? BellRing : Bell" aria-hidden="true" />{{ alreadySaved ? 'Search saved' : 'Save this search' }}
          </Button>
        </ClientOnly>
        <Button variant="outline" size="sm">Sort: Newest</Button>
      </div>
    </div>

    <div class="grid gap-10 lg:grid-cols-[250px_1fr]">
      <!-- Wide screens: stays in view while the dogs scroll, and scrolls itself if the window is too short for every filter -->
      <aside class="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--header-height)+16px)] lg:max-h-[calc(100dvh-var(--header-height)-32px)] lg:self-start lg:overflow-y-auto lg:pr-1 lg:pb-1 lg:[scrollbar-width:thin]" aria-label="Filters">
        <div class="flex flex-col gap-2.5">
          <span class="text-xs leading-4 font-bold tracking-[.08em] text-ink-muted uppercase">Property</span>
          <FilterChips v-model="properties" :options="propertyOptions" label="Property" />
        </div>
        <div class="flex flex-col gap-2.5">
          <span class="text-xs leading-4 font-bold tracking-[.08em] text-ink-muted uppercase">Protection level</span>
          <FilterChips v-model="levels" :options="levelOptions" label="Protection level" class="gap-1.5" item-class="w-10 justify-center px-0" />
          <span v-if="levels.length" class="text-sm leading-[22px] text-ink-muted">{{ levelSummary }}</span>
        </div>
        <div class="flex flex-col gap-2.5">
          <span class="text-xs leading-4 font-bold tracking-[.08em] text-ink-muted uppercase">City</span>
          <FilterChips v-model="cities" :options="cityOptions" label="City" />
        </div>
        <div class="flex flex-col gap-2.5">
          <span class="text-xs leading-4 font-bold tracking-[.08em] text-ink-muted uppercase">Household</span>
          <FilterChips v-model="household" :options="householdOptions" label="Household" />
        </div>
        <div class="flex flex-col gap-2.5">
          <span class="text-xs leading-4 font-bold tracking-[.08em] text-ink-muted uppercase">Breed</span>
          <FilterChips v-model="breeds" :options="breedOptions" label="Breed" />
        </div>
        <HelpPanel title="Not sure which level?" :icon="false" class="p-3.5">
          <NuxtLink to="/guide">Take the 2-minute match</NuxtLink>
        </HelpPanel>
      </aside>

      <div class="min-w-0">
        <div v-if="dogs.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 rise-stagger">
          <K9Card v-for="dog in dogs" :key="dog.fileNo" :dog="dog" />
        </div>
        <EmptyState v-else @clear="clearFilters" />
      </div>
    </div>
  </div>
</template>
