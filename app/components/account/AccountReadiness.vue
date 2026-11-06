<script setup lang="ts">
import { Check, ChevronRight } from '@lucide/vue'
import { computed } from 'vue'
import { cn } from '~/lib/utils'
import { useSession } from '~/composables/useSession'
import { useVisits } from '~/composables/useVisits'
import { reserveChecklist } from '~/utils/account'

// Overview panel: what a store needs from you before it takes a deposit on a dog. Each step still
// to do links to where to do it.
const { user } = useSession()
const { mine } = useVisits()
const items = computed(() => reserveChecklist(user.value, mine.value.some(v => v.status === 'done')))
const done = computed(() => items.value.filter(i => i.done).length)
</script>

<template>
  <SectionPanel title="Ready to reserve" :meta="`${done} of ${items.length}`">
    <div class="flex flex-col gap-4 p-3">
      <div class="flex gap-1" role="progressbar" :aria-valuenow="done" aria-valuemin="0" :aria-valuemax="items.length" aria-label="Reservation checklist">
        <span v-for="(item, i) in items" :key="i" :class="cn('h-1.5 flex-1 rounded-full', item.done ? 'bg-marigold' : 'bg-ash')" />
      </div>
      <ul class="m-0 flex list-none flex-col gap-1 p-0">
        <li v-for="item in items" :key="item.label">
          <component
            :is="!item.done && item.to ? 'NuxtLink' : 'div'"
            v-bind="!item.done && item.to ? { to: item.to } : {}"
            :class="cn('-mx-2 flex gap-3 rounded-lg px-2 py-1.5 text-ink no-underline', !item.done && item.to && 'hover:bg-surface-sunk')"
          >
            <span :class="cn('mt-px grid size-5 shrink-0 place-items-center rounded-full', item.done ? 'bg-ink text-canvas' : 'ring-[1.5px] ring-line-strong ring-inset')">
              <Check v-if="item.done" class="size-3" aria-hidden="true" />
            </span>
            <span class="flex flex-1 flex-col gap-0.5">
              <span :class="cn('text-sm leading-5', item.done ? 'text-ink-muted' : 'font-semibold')">{{ item.label }}</span>
              <span v-if="!item.done && item.text" class="text-[13px] leading-[18px] text-ink-muted">{{ item.text }}</span>
            </span>
            <ChevronRight v-if="!item.done && item.to" class="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          </component>
        </li>
      </ul>
    </div>
  </SectionPanel>
</template>
