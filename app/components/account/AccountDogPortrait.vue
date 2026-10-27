<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// An owned dog's picture. Until the owner adds a photo: the dog's initial, like the store banners,
// solid bottom-left with an outlined echo off the right edge. `compact` drops the echo for thumbnails.
// Give it a size (e.g. size-14 or aspect-square w-full); the letters scale with it.
const props = defineProps<{ name: string, photo?: string, compact?: boolean, class?: HTMLAttributes['class'] }>()
const initial = computed(() => props.name[0]?.toUpperCase() ?? '')
</script>

<template>
  <div :class="cn('relative shrink-0 overflow-hidden rounded-lg bg-marigold-soft [container-type:size]', props.class)">
    <img v-if="props.photo" :src="props.photo" :alt="props.name" class="size-full object-cover">
    <template v-else-if="props.compact">
      <span class="absolute inset-0 grid place-items-center mega text-[56cqh] leading-none text-marigold-ink select-none" aria-hidden="true">{{ initial }}</span>
    </template>
    <template v-else>
      <span class="pointer-events-none absolute top-1/2 -right-[14cqw] -translate-y-[46%] mega text-[115cqh] leading-none text-outline opacity-50 select-none" aria-hidden="true">{{ initial }}</span>
      <span class="absolute bottom-[9cqh] left-[10cqw] mega text-[46cqh] leading-[.8] text-marigold-ink select-none" aria-hidden="true">{{ initial }}</span>
    </template>
  </div>
</template>
