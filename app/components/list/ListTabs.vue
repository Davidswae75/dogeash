<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'

// Status tabs across the top of a list: one at a time, each with its count; the chosen one has a marigold
// underline and slides to the middle on phones. `urgent` tabs show their count in marigold when it isn't 0.
const props = defineProps<{ tabs: readonly { value: T, label: string, count?: number, urgent?: boolean }[], label?: string }>()
const model = defineModel<T>({ required: true })
const value = computed({ get: () => model.value, set: (v) => { if (v) model.value = v } })
</script>

<template>
  <ToggleGroup v-model="value" v-center-tab type="single" :aria-label="props.label ?? 'Show'" class="flex w-full justify-start gap-0 overflow-x-auto px-2 [scrollbar-width:none] sm:px-3">
    <ToggleGroupItem
      v-for="t in props.tabs"
      :key="t.value"
      :value="t.value"
      class="relative h-11 shrink-0 gap-2 rounded-none border-0 bg-transparent! px-3 text-sm font-semibold whitespace-nowrap text-ink-muted shadow-none hover:text-ink data-[state=on]:text-ink data-[state=on]:after:absolute data-[state=on]:after:inset-x-3 data-[state=on]:after:bottom-0 data-[state=on]:after:h-[3px] data-[state=on]:after:rounded-t-full data-[state=on]:after:bg-marigold"
    >
      {{ t.label }}
      <span v-if="t.count !== undefined" :class="['grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-mono text-[10.5px] font-bold', t.urgent && t.count ? 'bg-marigold text-on-marigold' : 'bg-surface-sunk text-ink-muted']">{{ t.count }}</span>
    </ToggleGroupItem>
  </ToggleGroup>
</template>
