<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// Wordmark with the marigold square, like a gate lamp
const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <NuxtLink
    to="/"
    aria-label="Dogeash home"
    :class="cn(
      'inline-flex items-baseline gap-[3px] font-display text-2xl leading-none font-black tracking-[-.03em] text-ink no-underline [font-stretch:120%] after:size-[9px] after:rounded-[2px] after:bg-marigold after:content-[\'\']',
      props.class,
    )"
  >dogeash</NuxtLink>
</template>
