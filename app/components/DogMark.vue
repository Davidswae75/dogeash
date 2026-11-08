<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'
import { dogMarkNose, dogMarkStrokes } from '~/utils/dogMarkPaths.mjs'

// Dogeash's dog: a guard dog's head, front on, ears up, drawn as one stroke weight.
// `animated` traces the outline in, holds, and lets it go, on a loop (the loader); without it, a still mark.
// Colours come from the text colour (`currentColor`); the nose is the marigold of the wordmark's square.
// Reduced motion always gets the still mark.
// `weight` is the stroke width on the 64-unit grid: heavier for small sizes (the logo), 2 for the loader
const props = withDefaults(defineProps<{ animated?: boolean, weight?: number, class?: HTMLAttributes['class'] }>(), { weight: 2 })

const strokes = dogMarkStrokes
</script>

<template>
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.weight"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    :class="cn('overflow-visible', props.class)"
  >
    <path
      v-for="(d, i) in strokes"
      :key="i"
      :d="d"
      pathLength="1"
      :class="props.animated && 'animate-dog-trace [stroke-dasharray:1] [stroke-dashoffset:1] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]'"
      :style="props.animated ? { animationDelay: `${i * 90}ms` } : undefined"
    />
    <!-- The nose -->
    <path
      :d="dogMarkNose"
      fill="var(--marigold)"
      stroke="var(--marigold)"
      stroke-width="1.2"
      :class="props.animated && 'origin-[32px_47.5px] animate-dog-nose motion-reduce:animate-none'"
    />
  </svg>
</template>
