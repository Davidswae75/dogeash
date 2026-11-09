<script setup lang="ts">
import { Check } from '@lucide/vue'
import type { ReadinessItem } from '~/utils/account'
import { cn } from '~/lib/utils'

// One step of "Ready to reserve": its tick and words (AccountReadiness makes it a link while it's still to do)
const props = defineProps<{ item: ReadinessItem }>()
</script>

<template>
  <span :class="cn('mt-px grid size-5 shrink-0 place-items-center rounded-full', props.item.done ? 'bg-ink text-canvas' : 'ring-[1.5px] ring-line-strong ring-inset')">
    <Check v-if="props.item.done" class="size-3" aria-hidden="true" />
  </span>
  <span class="flex flex-1 flex-col gap-0.5">
    <span :class="cn('text-sm leading-5', props.item.done ? 'text-ink-muted' : 'font-semibold')">{{ props.item.label }}</span>
    <span v-if="!props.item.done && props.item.text" class="text-[13px] leading-[18px] text-ink-muted">{{ props.item.text }}</span>
  </span>
</template>
