<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// The charcoal K9 file tab with its 4px hazard edge
const props = defineProps<{ fileNo: string, detail?: string, reserved?: boolean, class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    :class="cn(
      'relative flex items-center justify-between bg-night px-4 py-2.5 font-mono text-[11px] leading-none font-semibold tracking-[.1em] text-on-night uppercase',
      props.class,
    )"
  >
    <span>K9 file · {{ props.fileNo }}<template v-if="props.detail"> · {{ props.detail }}</template></span>
    <StatusDot :reserved="props.reserved" />
    <span aria-hidden="true" class="absolute inset-x-0 -bottom-1 h-1 hazard-thin" />
  </div>
</template>
