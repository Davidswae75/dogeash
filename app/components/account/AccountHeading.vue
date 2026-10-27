<script setup lang="ts">
// Top of each account page: a mono line, the heading with an outlined word, and room for actions
const props = defineProps<{ kicker: string, title: string, outline?: string, text?: string }>()
</script>

<template>
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="flex min-w-0 flex-col gap-2">
      <span class="font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">{{ props.kicker }}</span>
      <h1 class="m-0 mega text-[clamp(28px,3vw,40px)] leading-none">
        {{ props.title }} <span v-if="props.outline" class="text-outline">{{ props.outline }}</span>
      </h1>
      <p v-if="props.text" class="m-0 max-w-[40em] text-[15px] leading-6 text-ink-muted">{{ props.text }}</p>
    </div>
    <slot />
  </header>
</template>
