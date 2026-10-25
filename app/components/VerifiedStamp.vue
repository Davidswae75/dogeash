<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// The kennel stamp: verified blue, always with the word
const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <span
    :class="cn(
      'inline-flex -rotate-6 flex-col items-center justify-center rounded-sm border-2 border-verified bg-surface px-2 py-1 text-center font-mono text-[10px] leading-3 font-semibold tracking-[.1em] text-verified uppercase',
      props.class,
    )"
  >Verified<br>kennel</span>
</template>
