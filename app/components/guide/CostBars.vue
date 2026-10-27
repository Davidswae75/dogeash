<script setup lang="ts">
// First-year costs as low–high ranges on one shared scale
const max = Math.max(...guideFirstYearCosts.map(c => c.high))
const pct = (v: number) => `${(v / max) * 100}%`
const totalLow = guideFirstYearCosts.reduce((s, c) => s + c.low, 0)
const totalHigh = guideFirstYearCosts.reduce((s, c) => s + c.high, 0)
</script>

<template>
  <div class="flex flex-col gap-5">
    <ul class="m-0 flex list-none flex-col gap-4 p-0">
      <li v-for="cost in guideFirstYearCosts" :key="cost.label" class="grid gap-1.5 md:grid-cols-[240px_1fr_150px] md:items-center md:gap-5">
        <span>
          <strong class="block text-[15px] leading-[22px]">{{ cost.label }}</strong>
          <span class="text-[13px] leading-5 text-ink-muted">{{ cost.note }}</span>
        </span>
        <span class="relative h-3 rounded-full bg-line" aria-hidden="true">
          <span class="absolute inset-y-0 rounded-full bg-marigold" :style="{ left: pct(cost.low), width: pct(cost.high - cost.low), minWidth: '12px' }" />
          <span class="absolute inset-y-0 left-0 rounded-full bg-night" :style="{ width: pct(cost.low), minWidth: '12px' }" />
        </span>
        <span class="font-mono text-sm font-semibold tabular-nums md:text-right">{{ formatNairaRange(cost.low, cost.high) }}</span>
      </li>
    </ul>
    <div class="flex flex-wrap items-baseline justify-between gap-3 border-t-4 border-ink pt-4">
      <span class="text-xs leading-4 font-bold tracking-[.08em] uppercase">First year, all in</span>
      <span class="mega text-[clamp(28px,3vw,40px)] leading-none tabular-nums">{{ formatNairaRange(totalLow, totalHigh) }}</span>
    </div>
    <div class="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-muted">
      <span class="inline-flex items-center gap-2"><span class="inline-block h-2.5 w-6 rounded-full bg-night" aria-hidden="true" />Lowest you should expect</span>
      <span class="inline-flex items-center gap-2"><span class="inline-block h-2.5 w-6 rounded-full bg-marigold" aria-hidden="true" />Range up to the highest</span>
      <span class="font-mono">Example figures for the design. Confirm with the store and your vet.</span>
    </div>
  </div>
</template>
