<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// Wordmark with the marigold square, like a gate lamp. A link home, or plain text with `static` (the loader).
const props = defineProps<{ class?: HTMLAttributes['class'], static?: boolean }>()
const look = 'inline-flex items-baseline gap-[3px] font-display text-2xl leading-none font-black tracking-[-.03em] text-ink no-underline [font-stretch:120%] after:size-[9px] after:rounded-[2px] after:bg-marigold after:content-[\'\']'
</script>

<template>
  <span v-if="props.static" :class="cn(look, props.class)">dogeash</span>
  <NuxtLink v-else to="/" aria-label="Dogeash home" :class="cn(look, props.class)">dogeash</NuxtLink>
</template>
