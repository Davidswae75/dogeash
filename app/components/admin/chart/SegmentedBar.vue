<script setup lang="ts">
import { computed, ref } from 'vue'

// Parts of a whole (stores by status, dogs by status) as one bar of segments with 2px gaps,
// and a legend underneath with each part's count and share, so nothing depends on colour alone.
// Hovering a segment or its legend line highlights both.
const props = defineProps<{ parts: { key: string, label: string, value: number, color: string }[] }>()
const total = computed(() => props.parts.reduce((s, p) => s + p.value, 0))
const shown = computed(() => props.parts.filter(p => p.value > 0))
const pct = (v: number) => (total.value ? Math.round((v / total.value) * 100) : 0)
const active = ref<string>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-if="total" class="flex h-3 w-full gap-[2px]" role="img" :aria-label="props.parts.map(p => `${p.label} ${p.value}`).join(', ')">
      <span
        v-for="p in shown"
        :key="p.key"
        class="h-full min-w-1.5 transition-opacity first:rounded-l-full last:rounded-r-full"
        :style="{ flexGrow: p.value, background: p.color, opacity: active && active !== p.key ? 0.35 : 1 }"
        :title="`${p.label}: ${p.value} (${pct(p.value)}%)`"
        @pointerenter="active = p.key"
        @pointerleave="active = undefined"
      />
    </div>
    <div v-else class="h-3 w-full rounded-full bg-surface-sunk" />
    <ul class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-x-5 gap-y-1.5 p-0">
      <li
        v-for="p in props.parts"
        :key="p.key"
        :class="['flex items-center gap-2 text-[13px] transition-opacity', active && active !== p.key && 'opacity-50']"
        @pointerenter="active = p.key"
        @pointerleave="active = undefined"
      >
        <span class="size-2.5 shrink-0 rounded-[3px]" :style="{ background: p.color }" aria-hidden="true" />
        <span class="truncate text-ink-muted">{{ p.label }}</span>
        <span class="ml-auto font-mono text-ink tabular-nums">{{ p.value }}</span>
      </li>
    </ul>
  </div>
</template>
