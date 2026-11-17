<script setup lang="ts">
import { Search, X } from '@lucide/vue'

// The bar above every list: optional status tabs across the top (#tabs), then a search, a few compact filters
// (#filters), and on the right the order and view (#end). Under it, how many there are and a way to clear.
const props = withDefaults(defineProps<{ placeholder?: string, count?: number, noun?: [string, string], filtered?: boolean, searchable?: boolean }>(), { searchable: true, noun: () => ['result', 'results'] })
const search = defineModel<string>('search', { default: '' })
const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <section class="overflow-hidden rounded-xl bg-surface ring-1 ring-line" aria-label="Filters">
    <div v-if="$slots.tabs" class="border-b border-line">
      <slot name="tabs" />
    </div>
    <div class="flex flex-wrap items-center gap-2 p-3 sm:px-4">
      <label v-if="props.searchable" class="relative min-w-[160px] flex-[1_1_180px]">
        <span class="sr-only">{{ props.placeholder ?? 'Search' }}</span>
        <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <input v-model="search" type="search" :placeholder="props.placeholder ?? 'Search'" class="h-10 w-full rounded-lg border-0 bg-canvas pr-3 pl-9 text-sm text-ink ring-1 ring-line-strong outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-ink">
      </label>
      <div v-if="$slots.filters" class="flex flex-wrap items-center gap-2">
        <slot name="filters" />
      </div>
      <div v-if="$slots.end" class="ml-auto flex items-center gap-2">
        <slot name="end" />
      </div>
    </div>
    <div v-if="props.count !== undefined || props.filtered" class="flex items-center justify-between gap-3 border-t border-line bg-canvas/40 px-3 py-2 text-[13px] sm:px-4">
      <span class="text-ink-muted" aria-live="polite"><strong class="font-semibold text-ink tabular-nums">{{ props.count }}</strong> {{ props.count === 1 ? props.noun[0] : props.noun[1] }}</span>
      <button v-if="props.filtered" type="button" class="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[13px] font-semibold text-ink-muted hover:text-ink" @click="emit('clear')"><X class="size-3.5" aria-hidden="true" />Clear filters</button>
    </div>
  </section>
</template>
