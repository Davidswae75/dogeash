<script setup lang="ts">
import type { AuthPanelMeta } from '~/types/page-meta'

// The dark panel beside sign-in and sign-up: a headline, the kennel watch and three numbers
const props = defineProps<{ panel: AuthPanelMeta }>()

const stats = [
  { value: sampleStores.filter(s => s.verified).length, label: 'inspected stores' },
  { value: sampleDogs.filter(d => d.status === 'available').length, label: 'dogs for sale' },
  { value: 5, label: 'protection levels' },
]
</script>

<template>
  <aside class="relative m-3 hidden flex-col justify-between gap-8 overflow-hidden rounded-xl bg-night p-10 text-on-night lg:flex">
    <span class="absolute inset-x-0 top-0 h-1.5 hazard-thin" aria-hidden="true" />
    <div class="flex flex-col gap-3 pt-2">
      <span class="text-xs leading-4 font-bold tracking-[.08em] text-marigold uppercase">Trained guard dogs · Verified kennels</span>
      <p class="m-0 max-w-[16em] mega text-[clamp(30px,2.8vw,44px)] leading-none">
        {{ props.panel.title }} <span class="text-outline [-webkit-text-stroke-color:var(--on-night)]">{{ props.panel.outline }}</span>
      </p>
      <p class="m-0 max-w-[30em] text-[15px] leading-6">{{ props.panel.text }}</p>
    </div>
    <div class="mx-auto w-full max-w-[520px]">
      <KennelWatch :variant="props.panel.variant" />
    </div>
    <ul class="m-0 grid list-none grid-cols-3 gap-4 p-0">
      <li v-for="stat in stats" :key="stat.label" class="flex flex-col gap-1 border-t-[3px] border-marigold pt-3">
        <strong class="mega text-[28px] leading-none">{{ stat.value }}</strong>
        <span class="text-[13px]">{{ stat.label }}</span>
      </li>
    </ul>
  </aside>
</template>
