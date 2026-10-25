<script setup lang="ts">
import type { ProtectionLevel } from '~/utils/protection'
import { cn } from '~/lib/utils'

// The five levels as colour cards: surface, ash-soft, ash, marigold, night
const levels = Object.entries(protectionLevels).map(([n, level]) => ({ n: Number(n) as ProtectionLevel, ...level }))

const tones: Record<ProtectionLevel, string> = {
  1: 'bg-surface border border-line',
  2: 'bg-ash-soft',
  3: 'bg-ash text-on-ash',
  4: 'bg-marigold text-on-marigold',
  5: 'bg-night text-on-night',
}
</script>

<template>
  <ol class="m-0 grid list-none auto-cols-[minmax(200px,1fr)] grid-flow-col gap-2.5 overflow-x-auto p-0 md:grid-flow-row md:grid-cols-5 rise-stagger">
    <li
      v-for="level in levels"
      :key="level.n"
      :class="cn('flex min-h-[190px] animate-rise flex-col gap-2 rounded-lg p-[18px]', tones[level.n])"
    >
      <b class="font-display text-[52px] leading-none font-black tracking-[-.04em] [font-stretch:120%]">{{ level.n }}</b>
      <strong class="font-display text-base leading-5 font-bold [font-stretch:108%]">{{ level.name }}</strong>
      <p class="m-0 text-[13px] leading-[19px]">{{ level.description }}</p>
    </li>
  </ol>
</template>
