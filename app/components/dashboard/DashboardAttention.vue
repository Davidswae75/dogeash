<script setup lang="ts">
import { ArrowRight, ImagePlus, MessageSquare, Syringe, Wallet } from '@lucide/vue'
import type { Component } from 'vue'

// What needs doing, most urgent first. Only items this person's role can act on.
const { can } = useStoreContext()
const items = computed(() => dashboardAttention.filter(i => can(i.permission)))

const icons: Record<string, Component> = { MessageSquare, Wallet, Syringe, ImagePlus }
const tone: Record<string, { tile: string, rail: string }> = {
  marigold: { tile: 'bg-marigold text-on-marigold', rail: 'bg-marigold' },
  night: { tile: 'bg-night text-marigold', rail: 'bg-ink' },
  ash: { tile: 'bg-ash-soft text-ink', rail: 'bg-ash' },
}
</script>

<template>
  <SectionPanel title="Needs your attention" :meta="`${items.length} to do`">
    <ul class="m-0 flex list-none flex-col p-0">
      <li v-for="item in items" :key="item.title">
        <NuxtLink :to="item.to" class="group relative flex items-center gap-4 rounded-lg p-3 pl-4 text-ink no-underline hover:bg-surface-sunk">
          <span :class="['absolute top-3 bottom-3 left-0 w-1 rounded-r-full', tone[item.tone]!.rail]" aria-hidden="true" />
          <span :class="['grid size-10 shrink-0 place-items-center rounded-md', tone[item.tone]!.tile]">
            <component :is="icons[item.icon]" class="size-[18px]" aria-hidden="true" />
          </span>
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="flex flex-wrap items-baseline gap-x-2">
              <strong class="text-[15px] leading-5">{{ item.title }}</strong>
              <span class="font-mono text-[10.5px] font-semibold tracking-[.1em] text-ink-muted uppercase">{{ item.when }}</span>
            </span>
            <span class="text-[13px] leading-5 text-ink-muted">{{ item.text }}</span>
          </span>
          <span class="hidden shrink-0 items-center gap-1 text-[13px] font-bold sm:inline-flex">
            {{ item.action }}<ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </NuxtLink>
      </li>
    </ul>
  </SectionPanel>
</template>
