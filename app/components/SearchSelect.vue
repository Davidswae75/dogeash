<script setup lang="ts" generic="T extends string">
import { Check, ChevronDown } from '@lucide/vue'
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '~/lib/utils'

// A dropdown you can type into, for long lists (Nigerian banks). Same props as <SelectMenu>.
const props = defineProps<{
  options: { value: T, label: string }[]
  id?: string
  ariaLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  empty?: string
  class?: HTMLAttributes['class']
}>()
const model = defineModel<T | ''>({ default: '' })
const selected = computed(() => props.options.find(o => o.value === model.value))
</script>

<template>
  <Combobox v-model="model" :reset-search-term-on-blur="true">
    <ComboboxAnchor as-child>
      <ComboboxTrigger as-child>
        <button
          :id="props.id"
          type="button"
          :aria-label="props.ariaLabel"
          :class="cn('flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-line-strong bg-surface px-3 text-left text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink', props.class)"
        >
          <span :class="['truncate', !selected && 'text-ink-muted']">{{ selected?.label ?? props.placeholder ?? 'Choose' }}</span>
          <ChevronDown class="size-4 shrink-0 opacity-60" aria-hidden="true" />
        </button>
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxList class="w-(--reka-combobox-trigger-width) border-line bg-surface p-0">
      <ComboboxInput :placeholder="props.searchPlaceholder ?? 'Type to search'" class="text-ink" />
      <ComboboxEmpty class="px-3 py-4 text-center text-sm text-ink-muted">{{ props.empty ?? 'Nothing matches' }}</ComboboxEmpty>
      <ComboboxViewport class="max-h-64 overflow-y-auto p-1">
        <ComboboxItem v-for="o in props.options" :key="o.value" :value="o.value" :text-value="o.label" class="cursor-pointer text-ink data-[highlighted]:bg-surface-sunk">
          {{ o.label }}
          <ComboboxItemIndicator class="ml-auto"><Check class="size-4" aria-hidden="true" /></ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxViewport>
    </ComboboxList>
  </Combobox>
</template>
