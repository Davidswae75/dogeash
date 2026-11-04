<script setup lang="ts">
// A ranked list with a bar behind each count (live dogs by city): label, bar, value, all on one line
const props = defineProps<{ rows: { label: string, value: number }[], unit: string }>()
const max = () => Math.max(1, ...props.rows.map(r => r.value))
</script>

<template>
  <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
    <li v-for="r in props.rows" :key="r.label" class="relative flex h-8 items-center justify-between overflow-hidden rounded-md px-2.5 text-[13px]" :title="`${r.label}: ${r.value} ${props.unit}`">
      <span class="absolute inset-y-0 left-0 rounded-md bg-marigold/25" :style="{ width: `${(r.value / max()) * 100}%` }" aria-hidden="true" />
      <span class="relative font-medium text-ink">{{ r.label }}</span>
      <span class="relative font-mono text-ink tabular-nums">{{ r.value }}</span>
    </li>
  </ul>
</template>
