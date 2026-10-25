<script setup lang="ts" generic="T extends string | number">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// Pill toggles for search filters; several can be on at once
const props = defineProps<{ options: { value: T, label: string }[], label?: string, class?: HTMLAttributes['class'], itemClass?: HTMLAttributes['class'] }>()
const selected = defineModel<T[]>({ default: () => [] })
</script>

<template>
  <ToggleGroup
    v-model="selected"
    type="multiple"
    variant="chip"
    :aria-label="props.label"
    :class="cn('flex w-auto flex-wrap justify-start gap-2', props.class)"
  >
    <ToggleGroupItem
      v-for="option in props.options"
      :key="option.value"
      :value="option.value"
      :class="cn('rounded-full!', props.itemClass)"
    >
      {{ option.label }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>
