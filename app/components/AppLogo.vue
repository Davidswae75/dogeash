<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// Dogeash's logo, in three forms:
//   inline: the dog mark stands in for the "o" of "dogeash", compact for navigation bars (the default)
//   lockup: the dog mark beside the wordmark, for pages with room (sign-in, sign-up)
//   word:   the wordmark alone (the loader, which shows its own large dog)
// The marigold square after the word is the gate lamp. A link home, or plain with `static`.
const props = withDefaults(defineProps<{ class?: HTMLAttributes['class'], static?: boolean, variant?: 'inline' | 'lockup' | 'word' }>(), { variant: 'inline' })
const look = 'inline-flex items-center gap-[.32em] font-display text-2xl leading-none font-black tracking-[-.03em] text-ink no-underline [font-stretch:120%]'
</script>

<template>
  <span v-if="props.static" :class="cn(look, props.class)"><AppLogoMark :variant="props.variant" /></span>
  <NuxtLink v-else to="/" aria-label="Dogeash home" :class="cn(look, props.class)"><AppLogoMark :variant="props.variant" /></NuxtLink>
</template>
