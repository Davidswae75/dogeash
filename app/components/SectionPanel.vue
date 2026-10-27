<script setup lang="ts">
// A titled card used across Home, the account area and the store dashboard: title, optional count, "See all" and header actions
const props = defineProps<{ title: string, meta?: string, seeAll?: string, seeAllLabel?: string }>()
</script>

<template>
  <section class="flex min-w-0 flex-col rounded-xl bg-surface ring-1 ring-line">
    <header class="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div class="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2.5">
        <h2 class="m-0 truncate font-display text-lg leading-6 font-extrabold font-stretch-expanded">{{ props.title }}</h2>
        <span v-if="props.meta" class="font-mono text-[10.5px] font-semibold tracking-[.12em] whitespace-nowrap text-ink-muted uppercase">{{ props.meta }}</span>
      </div>
      <slot name="actions" />
      <NuxtLink v-if="props.seeAll" :to="props.seeAll" class="shrink-0 text-[13px] font-bold whitespace-nowrap text-ink underline decoration-marigold decoration-2 underline-offset-4 hover:decoration-ink">
        {{ props.seeAllLabel ?? 'See all' }}
      </NuxtLink>
    </header>
    <div class="flex flex-1 flex-col p-2">
      <slot />
    </div>
  </section>
</template>
