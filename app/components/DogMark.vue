<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// Dogeash's dog: a guard dog's head, front on, ears up, drawn as one stroke weight.
// `animated` traces the outline in, holds, and lets it go, on a loop (the loader); without it, a still mark.
// Colours come from the text colour (`currentColor`); the nose is the marigold of the wordmark's square.
// Reduced motion always gets the still mark.
const props = defineProps<{ animated?: boolean, class?: HTMLAttributes['class'] }>()

// Drawn in order: head outline, ears' inner folds, brow, eyes, muzzle. Each piece is one path so it traces in turn.
const strokes = [
  // Head: up the left ear, across the crown, down the right ear, round the cheek, down the muzzle, under the chin
  'M14 30 L10.5 6.5 Q10.3 5 11.6 5.8 L25 17 Q32 14.5 39 17 L52.4 5.8 Q53.7 5 53.5 6.5 L50 30 Q53 38 46 44 Q41.5 46.5 40 50 L39 54 Q32 59.5 25 54 L24 50 Q22.5 46.5 18 44 Q11 38 14 30 Z',
  // Inner ears
  'M15.6 25 L13.6 11.5 L22.6 19.2',
  'M48.4 25 L50.4 11.5 L41.4 19.2',
  // Brows, angled in: watchful
  'M20.5 26.2 Q24.5 24.8 28 27.4',
  'M43.5 26.2 Q39.5 24.8 36 27.4',
  // Forehead furrow
  'M32 22.5 L32 28.5',
  // Eyes
  'M21 31.6 Q24.2 28.6 27.4 31.6 Q24.2 33.4 21 31.6 Z',
  'M43 31.6 Q39.8 28.6 36.6 31.6 Q39.8 33.4 43 31.6 Z',
  // Mouth under the nose
  'M32 50.6 L32 52.6 M28 53 Q30.2 54.8 32 52.6 Q33.8 54.8 36 53',
]
</script>

<template>
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
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
      d="M28 46 Q32 44.2 36 46 Q35.6 49.5 32 50.6 Q28.4 49.5 28 46 Z"
      fill="var(--marigold)"
      stroke="var(--marigold)"
      stroke-width="1.2"
      :class="props.animated && 'origin-[32px_47.5px] animate-dog-nose motion-reduce:animate-none'"
    />
  </svg>
</template>
