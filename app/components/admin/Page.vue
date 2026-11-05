<script setup lang="ts">
// The top of an admin section: its title, a line on what it's for, a count, and actions on the right
const props = defineProps<{ title: string, description?: string, count?: number }>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="m-0 flex items-baseline gap-2.5 text-[26px] leading-8 font-semibold tracking-tight">
          {{ props.title }}<span v-if="props.count !== undefined" class="font-mono text-base font-normal text-ink-muted">{{ props.count }}</span>
        </h1>
        <p v-if="props.description" class="m-0 max-w-[56em] text-sm text-ink-muted">{{ props.description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2"><slot name="actions" /></div>
    </header>
    <slot />
  </div>
</template>
