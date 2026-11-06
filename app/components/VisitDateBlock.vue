<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'
import { visitDay } from '~/utils/time'

// A visit's day as a small calendar leaf: weekday on a band, the date, the month. Sized to its content and
// pinned to the top of whatever sits beside it (it never stretches to fill a card). `muted` greys the band for visits that are over.
const props = defineProps<{ day: string, muted?: boolean }>()
const parts = computed(() => visitDay(props.day))
</script>

<template>
  <span class="flex w-14 shrink-0 flex-col items-center self-start overflow-hidden rounded-md bg-surface ring-1 ring-line-strong">
    <span :class="cn('w-full py-0.5 text-center font-mono text-[10px] font-semibold tracking-[.1em] uppercase', props.muted ? 'bg-ash text-ink' : 'bg-night text-on-night')">{{ parts.weekday }}</span>
    <span class="flex flex-col items-center pt-1 pb-1.5">
      <span class="font-display text-[22px] leading-none font-extrabold">{{ parts.date }}</span>
      <span class="mt-0.5 font-mono text-[10px] leading-3 font-semibold tracking-[.1em] text-ink-muted uppercase">{{ parts.month }}</span>
    </span>
  </span>
</template>
