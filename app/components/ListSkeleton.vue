<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// Grey placeholders, in the shape of what's coming, while a list loads after the page has appeared.
// So a list never says "nothing here" before its data has arrived.
//   card:  cards with a picture or date leaf and a few lines (reservations, bookings, reviews, dogs)
//   tile:  a grid of dog cards with a portrait on top (My dogs)
//   row:   compact rows in a panel (payouts, a team, the overview's lists)
//   table: rows of an admin table
const props = withDefaults(defineProps<{ variant?: 'card' | 'tile' | 'row' | 'table', rows?: number, label?: string, class?: HTMLAttributes['class'] }>(), {
  variant: 'card',
  rows: 3,
  label: 'Loading',
})
</script>

<template>
  <div :class="cn(props.variant === 'tile' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col', props.variant === 'card' && 'gap-3', props.class)" role="status" :aria-label="props.label">
    <template v-for="i in props.rows" :key="i">
      <div v-if="props.variant === 'card'" class="flex items-start gap-4 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5" aria-hidden="true">
        <Skeleton class="size-16 shrink-0 rounded-lg" />
        <div class="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">
          <div class="flex items-center justify-between gap-3">
            <Skeleton class="h-4 w-2/5" />
            <Skeleton class="h-5 w-20 rounded-full" />
          </div>
          <Skeleton class="h-3 w-3/5" />
          <Skeleton class="h-3 w-1/3" />
        </div>
      </div>

      <div v-else-if="props.variant === 'tile'" class="flex flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-line" aria-hidden="true">
        <Skeleton class="aspect-4/3 rounded-none" />
        <div class="flex flex-col gap-2.5 p-4">
          <Skeleton class="h-4 w-1/2" />
          <Skeleton class="h-3 w-3/4" />
        </div>
      </div>

      <div v-else-if="props.variant === 'row'" :class="cn('flex items-center gap-3 py-3', i > 1 && 'border-t border-line')" aria-hidden="true">
        <Skeleton class="size-9 shrink-0 rounded-full" />
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton class="h-3.5 w-2/5" />
          <Skeleton class="h-3 w-1/4" />
        </div>
        <Skeleton class="h-4 w-16" />
      </div>

      <div v-else class="flex items-center gap-4 border-t border-line px-5 py-3" aria-hidden="true">
        <Skeleton class="h-3.5 w-1/4" />
        <Skeleton class="h-3.5 w-1/6" />
        <Skeleton class="h-3.5 w-1/5" />
        <Skeleton class="ml-auto h-3.5 w-14" />
      </div>
    </template>
    <span class="sr-only">{{ props.label }}…</span>
  </div>
</template>
