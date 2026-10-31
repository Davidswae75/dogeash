<script setup lang="ts">
// The patrol: a K9 chases a burglar along the compound wall, catches him, then turns and chases the next one.
// "day": marigold sky. "night": charcoal sky under a searchlight. Rendered by `npm run render:patrol`.
import dayGif from '~/assets/patrol/patrol-chase-day.gif'
import dayStill from '~/assets/patrol/patrol-chase-day.png'
import nightGif from '~/assets/patrol/patrol-chase-night.gif'
import nightStill from '~/assets/patrol/patrol-chase-night.png'

// `cover` fills its parent edge to edge, for use as a backdrop.
const props = withDefaults(defineProps<{ variant?: 'day' | 'night', cover?: boolean }>(), { variant: 'day' })

const src = computed(() => props.variant === 'night'
  ? { gif: nightGif, still: nightStill }
  : { gif: dayGif, still: dayStill })
</script>

<template>
  <!-- Reduced motion gets a still of the catch -->
  <picture :class="['block overflow-hidden', props.cover ? 'size-full' : 'rounded-[8%/10.667%]']">
    <source :srcset="src.still" media="(prefers-reduced-motion: reduce)">
    <img
      :src="src.gif"
      width="600"
      height="450"
      decoding="async"
      :class="['block max-w-full', props.cover ? 'size-full object-cover object-[50%_70%]' : 'h-auto w-full']"
      alt="A K9 guard dog chases a burglar along the compound wall, catches him by the ankle, then turns to chase the next one"
    >
  </picture>
</template>
