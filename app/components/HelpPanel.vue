<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// Guidance that answers the buyer's real question in one line
const props = withDefaults(defineProps<{ title: string, icon?: boolean, class?: HTMLAttributes['class'] }>(), { icon: true })
</script>

<template>
  <div :class="cn('flex items-start gap-3.5 rounded-lg bg-marigold-soft p-[18px]', props.class)">
    <AppIcon v-if="props.icon" name="info" :size="22" class="shrink-0 text-marigold-ink" />
    <div>
      <strong class="text-sm">{{ props.title }}</strong>
      <div class="mt-0.5 text-sm leading-[22px] text-ink [&_a]:font-bold [&_a]:text-action"><slot /></div>
    </div>
  </div>
</template>
