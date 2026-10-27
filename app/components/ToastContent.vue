<script setup lang="ts">
import type { Component } from 'vue'
import { ArrowRight, RotateCcw } from '@lucide/vue'
import { cn } from '~/lib/utils'

// The inside of every toast: a mono kicker line, a title, one line of detail and an optional action.
// Dog toasts show the dog's photo with a small badge; everything else shows a tinted icon tile.
export type ToastTone = 'success' | 'info' | 'warning' | 'error'
export interface ToastAction { label: string, onClick: () => void, kind?: 'go' | 'undo' }

const props = defineProps<{
  tone: ToastTone
  icon: Component
  kicker: string
  meta?: string
  title: string
  text?: string
  image?: string
  action?: ToastAction
}>()
const emit = defineEmits<{ 'close-toast': [] }>()

const tile: Record<ToastTone, string> = {
  success: 'bg-marigold text-on-marigold',
  info: 'bg-surface-sunk text-ink ring-1 ring-line',
  warning: 'bg-marigold-soft text-marigold-ink',
  error: 'bg-danger/12 text-danger',
}
const dot: Record<ToastTone, string> = {
  success: 'bg-marigold',
  info: 'bg-ink-muted',
  warning: 'bg-marigold',
  error: 'bg-danger',
}

function act() {
  props.action?.onClick()
  emit('close-toast')
}
</script>

<template>
  <div class="flex min-w-0 gap-3.5">
    <!-- Photo with a badge, or an icon tile -->
    <div v-if="props.image" class="relative size-12 shrink-0">
      <img :src="props.image" alt="" :class="cn('size-12 rounded-md object-cover', props.tone === 'info' && 'grayscale')">
      <span :class="cn('absolute -right-1.5 -bottom-1.5 grid size-[22px] place-items-center rounded-full ring-[3px] ring-surface', tile[props.tone])">
        <component :is="props.icon" class="size-3" aria-hidden="true" />
      </span>
    </div>
    <span v-else :class="cn('grid size-10 shrink-0 place-items-center rounded-md', tile[props.tone])">
      <component :is="props.icon" class="size-[18px]" aria-hidden="true" />
    </span>

    <div class="flex min-w-0 flex-1 flex-col">
      <span class="flex items-center gap-1.5 font-mono text-[10.5px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">
        <span :class="cn('size-1.5 rounded-full', dot[props.tone])" aria-hidden="true" />
        {{ props.kicker }}
        <template v-if="props.meta"><span aria-hidden="true">·</span><span class="truncate">{{ props.meta }}</span></template>
      </span>
      <strong class="mt-1 font-display text-[15px] leading-5 font-extrabold text-ink font-stretch-expanded">{{ props.title }}</strong>
      <span v-if="props.text" class="mt-0.5 text-[13px] leading-[19px] text-ink-muted">{{ props.text }}</span>

      <button
        v-if="props.action"
        type="button"
        class="mt-2.5 inline-flex h-7 w-fit cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent px-3 text-xs font-bold text-ink ring-1 ring-line-strong transition-colors hover:bg-ink hover:text-canvas"
        @click.stop="act"
      >
        <RotateCcw v-if="props.action.kind === 'undo'" class="size-3.5" aria-hidden="true" />
        {{ props.action.label }}
        <ArrowRight v-if="props.action.kind !== 'undo'" class="size-3.5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
