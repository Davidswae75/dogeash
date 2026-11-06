<script setup lang="ts" generic="T extends string">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '~/lib/utils'

// The one dropdown used across the site: shadcn's Select fed a list of options.
// `id` lets a <label for> (or FieldShell) point at it; `ariaLabel` names it when there's no visible label.
// `class` styles the button (height, width, border); the open list matches the button's width.
const props = defineProps<{
  options: readonly { value: T, label: string, disabled?: boolean }[]
  placeholder?: string
  id?: string
  ariaLabel?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}>()
const model = defineModel<T | ''>()
// An empty value shows the placeholder (the Select keeps '' for "nothing chosen")
const value = computed({ get: () => model.value || undefined, set: (v?: T | '') => { if (v) model.value = v } })
</script>

<template>
  <Select v-model="value" :disabled="props.disabled">
    <SelectTrigger :id="props.id" :aria-label="props.ariaLabel" :class="cn('w-full min-w-0 border-line-strong bg-surface text-ink', props.class)">
      <SelectValue :placeholder="props.placeholder ?? 'Choose'" />
    </SelectTrigger>
    <SelectContent class="border-line bg-surface text-ink">
      <SelectItem v-for="o in props.options" :key="o.value" :value="o.value" :disabled="o.disabled">{{ o.label }}</SelectItem>
    </SelectContent>
  </Select>
</template>
