<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// A panel in the admin console: a title, an optional line under it, actions on the right, then the content.
// `flush` lets tables and lists run to the card's edges.
const props = defineProps<{ title?: string, description?: string, flush?: boolean, class?: HTMLAttributes['class'] }>()
</script>

<template>
  <section :class="cn('flex min-w-0 flex-col rounded-2xl bg-surface shadow-[0_1px_0_rgb(0_0_0/.03),0_12px_32px_-24px_rgb(0_0_0/.35)] ring-1 ring-line', props.class)">
    <header v-if="props.title || $slots.actions" class="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
      <div class="flex min-w-0 flex-col gap-0.5">
        <h2 v-if="props.title" class="m-0 text-[14.5px] leading-5 font-semibold">{{ props.title }}</h2>
        <p v-if="props.description" class="m-0 text-[12.5px] leading-[18px] text-ink-muted">{{ props.description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2"><slot name="actions" /></div>
    </header>
    <div :class="props.flush ? 'pb-2' : 'px-5 pb-5'"><slot /></div>
  </section>
</template>
