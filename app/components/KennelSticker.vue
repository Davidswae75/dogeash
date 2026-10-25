<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// One slowly turning sticker per page at most
const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <span
    aria-hidden="true"
    :class="cn(
      'inline-grid size-[96px] sm:size-[112px] -rotate-12 animate-spin-slow place-items-center rounded-full border-4 border-surface bg-night text-center font-mono text-[10px] leading-3 sm:text-[11px] sm:leading-[14px] font-extrabold tracking-[.12em] text-marigold uppercase',
      props.class,
    )"
  ><slot>Verified<br>kennels<br>only</slot></span>
</template>
