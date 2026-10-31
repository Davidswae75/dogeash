<script setup lang="ts">
import type { InboxItem, InboxKind } from '~/utils/inbox'
import { cn } from '~/lib/utils'

// The inbox list: filter by kind, unread first in bold, the open item highlighted
const props = defineProps<{ items: InboxItem[], selected?: string }>()
const filter = defineModel<InboxKind | 'all'>('filter', { default: 'all' })
const emit = defineEmits<{ open: [id: string] }>()

const kinds = computed(() => {
  const present = new Set(props.items.map(i => i.kind))
  return (Object.keys(inboxKinds) as InboxKind[]).filter(k => present.has(k))
})
const shown = computed(() => filter.value === 'all' ? props.items : props.items.filter(i => i.kind === filter.value))
const unreadOf = (k: InboxKind | 'all') => props.items.filter(i => i.unread && (k === 'all' || i.kind === k)).length
</script>

<template>
  <section class="flex min-w-0 flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-line">
    <nav v-center-tab aria-label="Filter inbox" class="flex gap-1.5 overflow-x-auto border-b border-line p-3 [scrollbar-width:none]">
      <button
        v-for="k in (['all', ...kinds] as const)"
        :key="k"
        type="button"
        :aria-pressed="filter === k"
        :class="cn('inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1 text-[13px] font-semibold', filter === k ? 'border-ink bg-ink text-canvas' : 'border-line-strong bg-transparent text-ink hover:border-ink')"
        @click="filter = k"
      >
        {{ k === 'all' ? 'All' : inboxKinds[k].plural }}
        <span v-if="unreadOf(k)" :class="cn('grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold', filter === k ? 'bg-marigold text-on-marigold' : 'bg-marigold-soft text-ink')">{{ unreadOf(k) }}</span>
      </button>
    </nav>

    <ul class="m-0 flex list-none flex-col p-1.5">
      <li v-for="item in shown" :key="item.id">
        <button
          type="button"
          :class="cn('relative flex w-full cursor-pointer gap-3 rounded-lg border-0 p-3 text-left text-ink', item.id === props.selected ? 'bg-surface-sunk ring-1 ring-line-strong' : 'bg-transparent hover:bg-surface-sunk')"
          :aria-current="item.id === props.selected ? 'true' : undefined"
          @click="emit('open', item.id)"
        >
          <span :class="cn('grid size-10 shrink-0 place-items-center rounded-md', inboxKinds[item.kind].tile)">
            <component :is="inboxKinds[item.kind].icon" class="size-[18px]" aria-hidden="true" />
          </span>
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="flex items-baseline gap-2">
              <span :class="cn('flex-1 truncate text-sm leading-5', item.unread ? 'font-bold' : 'font-semibold text-ink-muted')">{{ item.from }} · {{ item.subject }}</span>
              <span class="shrink-0 font-mono text-[10.5px] text-ink-muted">{{ item.at }}</span>
            </span>
            <span :class="cn('truncate text-[13px] leading-[18px]', item.unread ? 'text-ink' : 'text-ink-muted')">{{ item.preview }}</span>
            <span class="flex items-center gap-2 pt-0.5">
              <span class="font-mono text-[10px] font-semibold tracking-[.1em] text-ink-muted uppercase">{{ inboxKinds[item.kind].label }}</span>
              <span v-if="item.status === 'replied'" class="rounded-full bg-ash-soft px-1.5 text-[10px] font-bold">Replied</span>
              <span v-else-if="item.status === 'done'" class="rounded-full bg-ash-soft px-1.5 text-[10px] font-bold">Done</span>
            </span>
          </span>
          <span v-if="item.unread" class="mt-1.5 size-2 shrink-0 rounded-full bg-marigold" aria-label="Unread" />
        </button>
      </li>
      <li v-if="!shown.length" class="p-6 text-center text-sm text-ink-muted">Nothing here.</li>
    </ul>
  </section>
</template>
