<script setup lang="ts">
import { Bell, CalendarCheck, Lock, PawPrint, TrendingDown } from '@lucide/vue'
import type { Component } from 'vue'
import type { NotificationKind } from '~/utils/account'
import { cn } from '~/lib/utils'

// The bell in the header: what changed for this buyer (sample notifications until accounts are connected)
const items = useState('account-notifications', () => sampleNotifications.map(n => ({ ...n })))
const unread = computed(() => items.value.filter(n => n.unread).length)

const kinds: Record<NotificationKind, { icon: Component, tile: string }> = {
  visit: { icon: CalendarCheck, tile: 'bg-marigold text-on-marigold' },
  reserved: { icon: Lock, tile: 'bg-night text-marigold' },
  price: { icon: TrendingDown, tile: 'bg-marigold-soft text-marigold-ink' },
  listing: { icon: PawPrint, tile: 'bg-surface-sunk text-ink ring-1 ring-line' },
}

function markAllRead() {
  items.value.forEach((n) => { n.unread = false })
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        type="button"
        class="relative grid size-[38px] cursor-pointer place-items-center rounded-full border-[1.5px] border-line-strong bg-transparent text-ink hover:bg-surface-sunk data-[state=open]:border-ink"
        :aria-label="`Notifications${unread ? `, ${unread} new` : ''}`"
      >
        <Bell class="size-[18px]" aria-hidden="true" />
        <span v-if="unread" class="absolute top-[7px] right-[8px] size-2 rounded-full bg-marigold ring-2 ring-canvas" aria-hidden="true" />
      </button>
    </PopoverTrigger>

    <PopoverContent align="end" :side-offset="10" class="w-[min(360px,calc(100vw-24px))] rounded-lg border-line bg-surface p-0 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
      <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div class="flex items-baseline gap-2">
          <strong class="font-display text-[15px] font-extrabold font-stretch-expanded">Notifications</strong>
          <span v-if="unread" class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ unread }} new</span>
        </div>
        <button
          v-if="unread"
          type="button"
          class="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-ink underline decoration-marigold decoration-2 underline-offset-4 hover:decoration-ink"
          @click="markAllRead"
        >Mark all read</button>
      </div>

      <ul class="m-0 flex max-h-[min(420px,60vh)] list-none flex-col overflow-y-auto p-1.5">
        <li v-for="n in items" :key="n.id">
          <NuxtLink
            :to="n.to"
            class="flex gap-3 rounded-md p-2.5 text-ink no-underline hover:bg-surface-sunk"
            @click="n.unread = false"
          >
            <span :class="cn('grid size-9 shrink-0 place-items-center rounded-md', kinds[n.kind].tile)">
              <component :is="kinds[n.kind].icon" class="size-4" aria-hidden="true" />
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="flex items-center gap-2">
                <strong :class="cn('flex-1 truncate text-sm leading-5', n.unread ? 'font-bold' : 'font-semibold text-ink-muted')">{{ n.title }}</strong>
                <span class="shrink-0 font-mono text-[10.5px] text-ink-muted">{{ n.at }}</span>
              </span>
              <span class="text-[13px] leading-[18px] text-ink-muted">{{ n.text }}</span>
            </span>
            <span :class="cn('mt-2 size-2 shrink-0 rounded-full', n.unread ? 'bg-marigold' : 'bg-transparent')" :aria-label="n.unread ? 'New' : undefined" />
          </NuxtLink>
        </li>
      </ul>
    </PopoverContent>
  </Popover>
</template>
