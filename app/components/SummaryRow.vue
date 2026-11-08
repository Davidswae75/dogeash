<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'

// One line for an item in a long list (a past reservation, say): a picture, what it is, one fact, and a
// chevron. Clicking it opens the full details (the page handles @click with a DetailDialog).
const props = defineProps<{ title: string, subtitle?: string, meta?: string, name?: string, photo?: string }>()
</script>

<template>
  <button type="button" class="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-surface p-3 text-left ring-1 ring-line transition-shadow hover:ring-line-strong">
    <AccountDogPortrait v-if="props.name" :name="props.name" :photo="props.photo" compact class="size-11 rounded-md" />
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <strong class="truncate text-[14.5px] leading-5">{{ props.title }}</strong>
      <span v-if="props.subtitle" class="truncate text-[13px] text-ink-muted">{{ props.subtitle }}</span>
    </span>
    <span v-if="props.meta" class="shrink-0 text-right text-[13px] font-semibold tabular-nums">{{ props.meta }}</span>
    <ChevronRight class="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
  </button>
</template>
