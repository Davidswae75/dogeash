<script setup lang="ts">
import { ArrowRight, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { SavedSearch } from '~/composables/useSavedSearches'
import { useNotify } from '~/composables/useNotify'
import { useSavedSearches } from '~/composables/useSavedSearches'
import { listedDogs } from '~/utils/dogs'
import { filtersToQuery, matchesFilters } from '~/utils/searchFilters'

// One saved search: what it looks for, the dogs that match now, alerts on or off, and remove (with undo)
const props = defineProps<{ search: SavedSearch }>()
const { setAlerts, remove, add } = useSavedSearches()
const notify = useNotify()

const matches = computed(() => listedDogs.value.filter(d => d.status === 'available' && matchesFilters(props.search.filters, d)))
const busy = ref(false)

async function toggleAlerts(on: boolean) {
  busy.value = true
  const error = await setAlerts(props.search.id, on)
  busy.value = false
  if (error) notify.error({ kicker: 'Saved searches', title: 'Not saved', text: error })
}

async function onRemove() {
  const filters = props.search.filters
  const error = await remove(props.search.id)
  if (error) return notify.error({ kicker: 'Saved searches', title: 'Not removed', text: error })
  notify.info({ kicker: 'Saved searches', title: 'Search removed', text: props.search.label, action: { label: 'Undo', kind: 'undo', onClick: () => add(filters) } })
}
</script>

<template>
  <li class="flex flex-col gap-4 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
    <div class="flex items-start gap-3">
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <strong class="font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">{{ props.search.label }}</strong>
        <span class="text-[13px] text-ink-muted">
          {{ matches.length }} {{ matches.length === 1 ? 'dog matches' : 'dogs match' }} now
          · alerts {{ props.search.alerts ? 'on' : 'off' }}
        </span>
      </div>
      <button type="button" class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-muted hover:bg-surface-sunk hover:text-ink" :aria-label="`Remove ${props.search.label}`" @click="onRemove">
        <Trash2 class="size-4" aria-hidden="true" />
      </button>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
      <div class="flex items-center gap-3">
        <div v-if="matches.length" class="flex -space-x-2">
          <img v-for="dog in matches.slice(0, 4)" :key="dog.fileNo" :src="dog.photo" :alt="dog.name" class="size-9 rounded-full border-2 border-surface object-cover">
        </div>
        <label :for="`alerts-${props.search.id}`" class="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <Switch :id="`alerts-${props.search.id}`" :model-value="props.search.alerts" :disabled="busy" @update:model-value="toggleAlerts" />
          Tell me about new dogs
        </label>
      </div>
      <Button as-child variant="outline" size="sm">
        <NuxtLink :to="{ path: '/dogs', query: filtersToQuery(props.search.filters) }">See dogs <ArrowRight aria-hidden="true" /></NuxtLink>
      </Button>
    </div>
  </li>
</template>
