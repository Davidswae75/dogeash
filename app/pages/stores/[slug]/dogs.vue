<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import type { ProtectionLevel } from '~/utils/protection'
import { computed, ref } from 'vue'
import { createError, useRoute, useSeoMeta } from '#imports' // nuxt
import { findStore, storeSummary } from '~/utils/stores'

// All of a store's dogs, with filters: protection level, availability, sex, breed, and an order.
// The store's own page shows its 3 pinned (or first) dogs and links here for the rest.
const route = useRoute()
const store = findStore(String(route.params.slug))
if (!store) throw createError({ statusCode: 404, statusMessage: 'No store with that name' })
const summary = storeSummary(store)

useSeoMeta({
  title: `Dogs from ${store.name}, ${store.city} · Dogeash`,
  description: `${summary.dogs.length} guard dogs from ${store.name}, a kennel inspected by Dogeash.`,
})

const levels = ref<ProtectionLevel[]>([])
const availableOnly = ref<string[]>([])
const sexes = ref<string[]>([])
const breeds = ref<string[]>([])
const order = ref<'pinned' | 'price-low' | 'price-high' | 'level'>('pinned')

const levelOptions = summary.levels.map(n => ({ value: n, label: `Level ${n}` }))
const sexOptions = [...new Set(summary.dogs.map(d => d.sex))].map(s => ({ value: s, label: s }))
const breedOptions = summary.breeds.map(b => ({ value: b, label: b }))
const orderOptions = [
  { value: 'pinned', label: 'Store\'s picks first' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'level', label: 'Protection: highest first' },
] as const

const shown = computed(() => {
  const list = summary.dogs.filter(d =>
    (!levels.value.length || levels.value.includes(d.level))
    && (!availableOnly.value.length || d.status === 'available')
    && (!sexes.value.length || sexes.value.includes(d.sex))
    && (!breeds.value.length || breeds.value.includes(d.breed)))
  const pinRank = (p?: string | null) => p ?? '~'
  const sorters = {
    'pinned': (a: typeof list[number], b: typeof list[number]) => pinRank(a.pinnedAt).localeCompare(pinRank(b.pinnedAt)) || Number(a.status === 'reserved') - Number(b.status === 'reserved'),
    'price-low': (a: typeof list[number], b: typeof list[number]) => a.priceNaira - b.priceNaira,
    'price-high': (a: typeof list[number], b: typeof list[number]) => b.priceNaira - a.priceNaira,
    'level': (a: typeof list[number], b: typeof list[number]) => b.level - a.level,
  }
  return [...list].sort(sorters[order.value])
})
const filtered = computed(() => levels.value.length + availableOnly.value.length + sexes.value.length + breeds.value.length > 0)
function clear() {
  levels.value = []
  availableOnly.value = []
  sexes.value = []
  breeds.value = []
}
</script>

<template>
  <div v-if="store" class="mx-auto flex max-w-page flex-col gap-6 px-4 pt-6 pb-16 sm:px-8">
    <NuxtLink :to="`/stores/${store.slug}`" class="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted no-underline hover:text-ink">
      <ArrowLeft class="size-4" aria-hidden="true" />{{ store.name }}
    </NuxtLink>
    <header class="flex flex-col gap-2">
      <span class="text-xs leading-4 font-bold tracking-[.08em] text-ink-muted uppercase">{{ summary.dogs.length }} listed · {{ summary.available }} available · {{ store.city }}</span>
      <h1 class="m-0 font-display text-[clamp(30px,4.5vw,44px)] leading-none font-extrabold font-stretch-expanded">Dogs from {{ store.name }}</h1>
    </header>

    <div v-if="summary.dogs.length" class="flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
      <div class="flex flex-wrap items-center gap-2">
        <FilterChips v-model="availableOnly" :options="[{ value: 'yes', label: 'Available only' }]" label="Availability" />
        <FilterChips v-if="levelOptions.length > 1" v-model="levels" :options="levelOptions" label="Protection level" />
        <FilterChips v-if="sexOptions.length > 1" v-model="sexes" :options="sexOptions" label="Sex" />
      </div>
      <FilterChips v-if="breedOptions.length > 1" v-model="breeds" :options="breedOptions" label="Breed" />
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <span class="text-sm text-ink-muted" aria-live="polite">{{ shown.length }} of {{ summary.dogs.length }} {{ summary.dogs.length === 1 ? 'dog' : 'dogs' }}</span>
        <SelectMenu v-model="order" :options="orderOptions" aria-label="Order" class="h-10! w-[220px]" />
      </div>
    </div>

    <div v-if="shown.length" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <K9Card v-for="dog in shown" :key="dog.fileNo" :dog="dog" />
    </div>
    <HelpPanel v-else-if="!summary.dogs.length" title="No dogs listed yet">
      {{ store.name }}'s dogs will appear here once they're listed.
    </HelpPanel>
    <p v-else class="m-0 text-[15px] text-ink-muted">
      No dogs match those filters.
      <button v-if="filtered" type="button" class="cursor-pointer border-0 bg-transparent p-0 font-bold text-ink underline" @click="clear">Show all dogs</button>
    </p>
  </div>
</template>
