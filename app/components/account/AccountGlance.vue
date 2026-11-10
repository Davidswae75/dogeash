<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { cn } from '~/lib/utils'
import { computed } from 'vue'
import { useShortlist } from '~/composables/useShortlist'
import { useVisits } from '~/composables/useVisits'
import { useSavedSearches } from '~/composables/useSavedSearches'
import { filtersToQuery } from '~/utils/searchFilters'
import { visitDay } from '~/utils/time'
import { COMPARE_MAX } from '~/utils/compare'
import { marketRows } from '~/utils/market'

// Four tiles under the welcome: shortlist, compare, next visit, saved search. Each one opens its page.
const { count, compareDogs } = useShortlist()
const { upcoming } = useVisits()
const next = computed(() => upcoming.value[0])
// The first saved search with alerts on (or the first at all)
const { searches } = useSavedSearches()
const search = computed(() => searches.value.find(s => s.alerts) ?? searches.value[0])
const searchMatches = computed(() => (search.value ? marketRows.savedSearch(search.value.filters).length : 0))

const tiles = computed(() => [
  { label: 'Shortlist', value: String(count.value), text: count.value ? 'Dogs saved to compare and visit' : 'Tap the heart on any dog', to: '/account/shortlist', tone: 'surface' },
  { label: 'Comparing', value: `${compareDogs.value.length}/${COMPARE_MAX}`, text: compareDogs.value.length > 1 ? 'Ready to compare side by side' : 'Tick 2 or 3 dogs on your shortlist', to: compareDogs.value.length > 1 ? '/account/shortlist/compare' : '/account/shortlist', tone: 'surface' },
  ...(next.value ? [{ label: 'Next visit', value: visitDay(next.value.day).label, text: `${next.value.slot} · ${next.value.storeName}`, to: '/account/visits', tone: 'marigold' }] : []),
  search.value
    ? { label: 'Saved search', value: String(searchMatches.value), text: `Dogs matching ${search.value.label}`, to: `/dogs?${new URLSearchParams(filtersToQuery(search.value.filters))}`, tone: 'night' }
    : { label: 'Saved searches', value: '0', text: 'Save a search on Find a guard dog', to: '/dogs', tone: 'night' },
])

const tones: Record<string, string> = {
  surface: 'bg-surface text-ink ring-1 ring-line hover:ring-ink',
  marigold: 'bg-marigold text-on-marigold hover:ring-2 hover:ring-ink',
  night: 'bg-night text-on-night hover:ring-2 hover:ring-marigold',
}
</script>

<template>
  <ClientOnly>
    <nav aria-label="Your activity" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <NuxtLink
        v-for="(tile, i) in tiles"
        :key="tile.label"
        :to="tile.to"
        :class="cn('group relative flex min-h-[132px] animate-rise flex-col justify-between gap-3 rounded-lg p-4 no-underline transition-shadow sm:p-5', tones[tile.tone])"
        :style="{ animationDelay: `${i * 60}ms` }"
      >
        <span class="flex items-center justify-between gap-2 font-mono text-[10.5px] leading-4 font-semibold tracking-[.12em] uppercase opacity-80">
          {{ tile.label }}
          <ArrowUpRight class="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>
        <span class="flex flex-col gap-1">
          <strong class="font-display text-[clamp(26px,2.6vw,34px)] leading-none font-extrabold tabular-nums font-stretch-expanded">{{ tile.value }}</strong>
          <span class="text-[13px] leading-[18px] opacity-80">{{ tile.text }}</span>
        </span>
      </NuxtLink>
    </nav>
    <template #fallback>
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">
        <span v-for="i in 4" :key="i" class="min-h-[132px] rounded-lg bg-surface ring-1 ring-line" />
      </div>
    </template>
  </ClientOnly>
</template>
