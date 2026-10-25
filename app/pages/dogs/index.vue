<script setup lang="ts">
import type { PropertyType, ProtectionLevel } from '~/utils/protection'

useSeoMeta({ title: 'Find a guard dog · Dogeash' })

const route = useRoute()

const properties = ref<PropertyType[]>(route.query.property ? [route.query.property as PropertyType] : [])
const levels = ref<ProtectionLevel[]>([])
const household = ref<string[]>([])
const breeds = ref<string[]>([])

const propertyOptions = propertyTypes.map(p => ({ value: p.value, label: p.label }))
const levelOptions = ([1, 2, 3, 4, 5] as const).map(n => ({ value: n, label: String(n) }))
const householdOptions = [{ value: 'children', label: 'Safe with children' }]
const breedOptions = [...new Set(sampleDogs.map(d => d.breed))].map(b => ({ value: b, label: b }))

const dogs = computed(() => sampleDogs.filter(dog =>
  (!properties.value.length || properties.value.some(p => dog.property.includes(p)))
  && (!levels.value.length || levels.value.includes(dog.level))
  && (!household.value.includes('children') || dog.safeWithChildren)
  && (!breeds.value.length || breeds.value.includes(dog.breed)),
))

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
      <Button variant="outline" size="sm">Sort: Newest</Button>
    </div>

    <div class="grid gap-10 lg:grid-cols-[250px_1fr]">
      <aside class="flex flex-col gap-6" aria-label="Filters">
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
