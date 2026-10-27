<script setup lang="ts">
import { ArrowDownRight, ArrowUpRight } from '@lucide/vue'

// This week in four numbers: one connected strip, each with its change and a filled 7-day trend
const stats = dashboardStats

// Points for a 7-day trend in a 100×36 box; the area version closes along the bottom
function line(values: readonly number[]) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const span = Math.max(max - min, 1)
  return values.map((v, i) => `${(i / (values.length - 1)) * 100},${32 - ((v - min) / span) * 26}`).join(' ')
}
const area = (values: readonly number[]) => `0,36 ${line(values)} 100,36`
</script>

<template>
  <section aria-label="This week" class="flex flex-col gap-2">
    <div class="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line xl:grid-cols-4">
      <div v-for="(stat, i) in stats" :key="stat.label" class="flex animate-rise flex-col gap-3 bg-surface p-4 sm:p-5" :style="{ animationDelay: `${i * 60}ms` }">
        <span class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ stat.label }}</span>
        <div class="flex items-baseline gap-2.5">
          <span class="mega text-[clamp(28px,2.6vw,36px)] leading-none tabular-nums">{{ stat.value }}</span>
          <span :class="['inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold', stat.up ? 'bg-marigold-soft text-ink' : 'bg-ash-soft text-ink-muted']">
            <component :is="stat.up ? ArrowUpRight : ArrowDownRight" class="size-3" aria-hidden="true" />{{ stat.change }}
          </span>
        </div>
        <svg viewBox="0 0 100 36" preserveAspectRatio="none" class="h-9 w-full" aria-hidden="true">
          <polygon :points="area(stat.trend)" class="fill-marigold/15" />
          <polyline :points="line(stat.trend)" fill="none" class="stroke-marigold" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
    <p class="m-0 font-mono text-[11px] text-ink-muted">Last 7 days, compared with the week before · example figures</p>
  </section>
</template>
