<script setup lang="ts">
// The kennel watch: a K9 guards its kennel, braces and barks at a rustling bush, then settles back.
// Used on sign-in and sign-up. Rendered by `npm run render:kennel`.
import dayGif from '~/assets/patrol/kennel-watch-day.gif'
import dayStill from '~/assets/patrol/kennel-watch-day.png'
import nightGif from '~/assets/patrol/kennel-watch-night.gif'
import nightStill from '~/assets/patrol/kennel-watch-night.png'

const props = withDefaults(defineProps<{ variant?: 'day' | 'night' }>(), { variant: 'night' })

const src = computed(() => props.variant === 'night'
  ? { gif: nightGif, still: nightStill }
  : { gif: dayGif, still: dayStill })
</script>

<template>
  <!-- Reduced motion gets a still of the dog on watch -->
  <picture class="block overflow-hidden rounded-[8%/10.667%]">
    <source :srcset="src.still" media="(prefers-reduced-motion: reduce)">
    <img
      :src="src.gif"
      width="600"
      height="450"
      decoding="async"
      class="block h-auto w-full max-w-full"
      alt="A K9 guard dog stands watch beside its kennel, barks at a rustling bush by the gate, then settles back to its watch"
    >
  </picture>
</template>
