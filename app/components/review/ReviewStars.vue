<script setup lang="ts">
import { Star } from '@lucide/vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// A rating as five stars, marigold up to the score
const props = defineProps<{ rating: number, class?: HTMLAttributes['class'] }>()
</script>

<template>
  <span class="flex gap-0.5" role="img" :aria-label="`${props.rating} out of 5`">
    <Star v-for="n in 5" :key="n" :class="cn('size-3.5', n <= props.rating ? 'fill-marigold text-marigold' : 'text-line-strong', props.class)" aria-hidden="true" />
  </span>
</template>
