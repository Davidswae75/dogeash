<script setup lang="ts">
import { computed } from 'vue'
import { visitDay } from '~/utils/time'

// A visit's day as a small calendar leaf: weekday on a charcoal band, the date, the month
const props = defineProps<{ day: string }>()
const parts = computed(() => visitDay(props.day))
</script>

<template>
  <span class="flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-md ring-1 ring-line-strong">
    <span class="w-full bg-night py-0.5 text-center font-mono text-[10px] font-semibold tracking-[.1em] text-on-night uppercase">{{ parts.weekday }}</span>
    <span class="pt-1 font-display text-[22px] leading-none font-extrabold">{{ parts.date }}</span>
    <span class="pb-1 font-mono text-[10px] font-semibold tracking-[.1em] text-ink-muted uppercase">{{ parts.month }}</span>
  </span>
</template>
