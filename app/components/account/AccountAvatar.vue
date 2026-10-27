<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Store } from '@lucide/vue'
import { cn } from '~/lib/utils'

// The signed-in person's initials on a marigold disc (no photos until profiles exist).
// `store` adds a small store badge for people who work at a store.
const props = defineProps<{ initials: string, store?: boolean, class?: HTMLAttributes['class'] }>()
</script>

<template>
  <span class="relative inline-grid shrink-0">
    <span
      :class="cn('grid size-[38px] shrink-0 place-items-center rounded-full bg-marigold font-display text-[13px] leading-none font-extrabold text-on-marigold font-stretch-expanded select-none', props.class)"
      aria-hidden="true"
    >{{ props.initials }}</span>
    <span v-if="props.store" class="absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-night text-marigold ring-2 ring-canvas" aria-hidden="true">
      <Store class="size-2.5" />
    </span>
  </span>
</template>
