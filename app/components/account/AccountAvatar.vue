<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// The signed-in buyer's initials on a marigold disc (no photos until profiles exist)
const props = defineProps<{ initials: string, class?: HTMLAttributes['class'] }>()
</script>

<template>
  <span
    :class="cn('grid size-[38px] shrink-0 place-items-center rounded-full bg-marigold font-display text-[13px] leading-none font-extrabold text-on-marigold font-stretch-expanded select-none', props.class)"
    aria-hidden="true"
  >{{ props.initials }}</span>
</template>
