<script setup lang="ts">
import { Check } from '@lucide/vue'
import { cn } from '~/lib/utils'

// Overview panel: what a store needs from you before it takes a deposit on a dog
const items = reserveChecklist
const done = items.filter(i => i.done).length
</script>

<template>
  <SectionPanel title="Ready to reserve" :meta="`${done} of ${items.length}`">
    <div class="flex flex-col gap-4 p-3">
      <div class="flex gap-1" role="progressbar" :aria-valuenow="done" aria-valuemin="0" :aria-valuemax="items.length" aria-label="Reservation checklist">
        <span v-for="(item, i) in items" :key="i" :class="cn('h-1.5 flex-1 rounded-full', item.done ? 'bg-marigold' : 'bg-ash')" />
      </div>
      <ul class="m-0 flex list-none flex-col gap-3 p-0">
        <li v-for="item in items" :key="item.label" class="flex gap-3">
          <span :class="cn('mt-px grid size-5 shrink-0 place-items-center rounded-full', item.done ? 'bg-ink text-canvas' : 'ring-[1.5px] ring-line-strong ring-inset')">
            <Check v-if="item.done" class="size-3" aria-hidden="true" />
          </span>
          <span class="flex flex-col gap-0.5">
            <span :class="cn('text-sm leading-5', item.done ? 'text-ink-muted' : 'font-semibold')">{{ item.label }}</span>
            <span v-if="item.text" class="text-[13px] leading-[18px] text-ink-muted">{{ item.text }}</span>
          </span>
        </li>
      </ul>
    </div>
  </SectionPanel>
</template>
