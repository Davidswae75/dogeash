<script setup lang="ts">
// Heading for every auth step: solid words, one outlined word, a line of text. `done` adds the check badge.
const props = defineProps<{ title: string, outline: string, text?: string, done?: boolean }>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <span v-if="props.done" class="mb-2 grid size-12 place-items-center rounded-full bg-marigold text-on-marigold">
      <AppIcon name="check" :size="24" />
    </span>
    <h1 class="m-0 mega text-[clamp(30px,3.8vw,46px)] leading-[.98]">
      {{ props.title }} <span class="text-outline">{{ props.outline }}</span>
    </h1>
    <p v-if="props.text || $slots.default" class="m-0 text-[15px] leading-6 text-ink-muted">
      <slot>{{ props.text }}</slot>
    </p>
  </div>
</template>
