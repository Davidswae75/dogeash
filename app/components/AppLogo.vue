<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// Dogeash's logo: the dog mark beside the wordmark, whose marigold square is like a gate lamp.
// A link home, or plain with `static`. `mark: false` leaves the dog out (the loader shows its own, large).
const props = withDefaults(defineProps<{ class?: HTMLAttributes['class'], static?: boolean, mark?: boolean }>(), { mark: true })
const look = 'inline-flex items-center gap-[.32em] font-display text-2xl leading-none font-black tracking-[-.03em] text-ink no-underline [font-stretch:120%]'
const word = 'inline-flex items-baseline gap-[3px] after:size-[9px] after:rounded-[2px] after:bg-marigold after:content-[\'\']'
</script>

<template>
  <span v-if="props.static" :class="cn(look, props.class)">
    <DogMark v-if="props.mark" :weight="2.8" class="size-[1.55em] shrink-0" />
    <span :class="word">dogeash</span>
  </span>
  <NuxtLink v-else to="/" aria-label="Dogeash home" :class="cn(look, props.class)">
    <DogMark v-if="props.mark" :weight="2.8" class="size-[1.55em] shrink-0" />
    <span :class="word">dogeash</span>
  </NuxtLink>
</template>
