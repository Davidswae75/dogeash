<script setup lang="ts">
import type { PropertyType } from '~/utils/protection'
import { cn } from '~/lib/utils'

// "What are you protecting?": the main way in, ahead of breed
const emit = defineEmits<{ select: [value: PropertyType] }>()

const tones = [
  'bg-marigold text-on-marigold',
  'bg-night text-on-night',
  'bg-surface text-ink',
  'bg-ash-soft text-ink',
]
</script>

<template>
  <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
    <button
      v-for="(property, i) in propertyTypes"
      :key="property.value"
      type="button"
      :class="cn(
        'flex min-h-[116px] cursor-pointer flex-col justify-between gap-4 rounded-lg border-0 p-[18px] text-left transition-transform duration-200 hover:-translate-y-[3px]',
        tones[i],
      )"
      @click="emit('select', property.value)"
    >
      <AppIcon :name="property.value" :size="30" />
      <span class="flex flex-col gap-0.5">
        <strong class="font-display text-lg leading-[22px] font-extrabold [font-stretch:112%]">{{ property.label }}</strong>
        <small class="font-mono text-xs leading-4 font-medium">{{ property.hint }}</small>
      </span>
    </button>
  </div>
</template>
