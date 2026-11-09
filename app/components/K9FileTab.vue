<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// The charcoal tab on top of a dog's card and page, with its 4px hazard edge: the store's name (or another
// label) on the left, whether the dog is available or reserved on the right
const props = defineProps<{ label: string, detail?: string, reserved?: boolean, class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    :class="cn(
      'relative flex items-center justify-between gap-3 bg-night px-4 py-2.5 font-mono text-[11px] leading-none font-semibold tracking-[.1em] text-on-night uppercase',
      props.class,
    )"
  >
    <span class="min-w-0 truncate">{{ props.label }}<template v-if="props.detail"> · {{ props.detail }}</template></span>
    <StatusDot :reserved="props.reserved" class="shrink-0" />
    <span aria-hidden="true" class="absolute inset-x-0 -bottom-1 h-1 hazard-thin" />
  </div>
</template>
