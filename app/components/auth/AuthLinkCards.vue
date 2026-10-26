<script setup lang="ts">
import type { Component } from 'vue'

// Big link cards for "where next" after signing in or up. The first one is the main action.
export interface AuthLinkCard {
  to: string
  title: string
  text: string
  icon: Component
}

const props = defineProps<{ items: AuthLinkCard[] }>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <NuxtLink
      v-for="(item, i) in props.items"
      :key="item.to"
      :to="item.to"
      :class="[
        'group flex animate-rise items-center gap-4 rounded-lg p-4 no-underline transition-shadow',
        i === 0 ? 'bg-night text-on-night hover:ring-2 hover:ring-marigold' : 'bg-surface text-ink ring-1 ring-line hover:ring-2 hover:ring-ink',
      ]"
      :style="{ animationDelay: `${i * 80}ms` }"
    >
      <span :class="['grid size-11 shrink-0 place-items-center rounded-md', i === 0 ? 'bg-marigold text-on-marigold' : 'bg-ash-soft']">
        <component :is="item.icon" class="size-5" aria-hidden="true" />
      </span>
      <span class="flex-1">
        <strong class="block text-[15px]">{{ item.title }}</strong>
        <span :class="['text-[13px]', i > 0 && 'text-ink-muted']">{{ item.text }}</span>
      </span>
      <AppIcon name="arrow-right" :size="18" class="transition-transform group-hover:translate-x-0.5" />
    </NuxtLink>
  </div>
</template>
