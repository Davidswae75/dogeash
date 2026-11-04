<script setup lang="ts">
import { computed } from 'vue'

// A tiny trend line for a KPI card: no axes, just the shape (it stretches to the card's width)
const props = defineProps<{ values: number[] }>()
const W = 120
const H = 32
const path = computed(() => {
  const max = Math.max(1, ...props.values)
  const step = props.values.length > 1 ? W / (props.values.length - 1) : W
  return props.values.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)},${(H - 3 - (v / max) * (H - 6)).toFixed(1)}`).join(' ')
})
</script>

<template>
  <svg :viewBox="`-2 0 ${W + 4} ${H}`" class="h-8 w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
    <path :d="`${path} L${W},${H} L0,${H} Z`" fill="var(--chart-fill)" opacity=".14" />
    <path :d="path" fill="none" stroke="var(--chart-line)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
  </svg>
</template>
