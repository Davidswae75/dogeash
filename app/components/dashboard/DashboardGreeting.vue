<script setup lang="ts">
import { CalendarCheck, CalendarDays, MessageSquare } from '@lucide/vue'
import { computed } from 'vue'
import { useSession } from '~/composables/useSession'
import { useStoreContext } from '~/composables/useStoreContext'
import { useStoreInbox } from '~/composables/useStoreInbox'

// Top of the overview: the day, who's here, and what's waiting, from the inbox and visits.
// Each chip shows only if this person's role can act on it.
const { store, roleLabel, can } = useStoreContext()
const { firstName } = useSession()
const { unreadMessages, waiting, today } = useStoreInbox()
const dateLabel = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const chips = computed(() => [
  ...(can('enquiries') ? [{ icon: MessageSquare, label: plural(unreadMessages.value, 'unread message', 'unread messages'), to: '/dashboard/inbox?type=message', strong: !!unreadMessages.value }] : []),
  ...(can('bookings')
    ? [
        { icon: CalendarDays, label: `${plural(waiting.value.length, 'visit request', 'visit requests')} to answer`, to: '/dashboard/bookings', strong: !!waiting.value.length },
        { icon: CalendarCheck, label: `${plural(today.value.length, 'visit', 'visits')} today`, to: '/dashboard/bookings', strong: false },
      ]
    : []),
])
</script>

<template>
  <section class="flex animate-rise flex-col gap-4">
    <span class="font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">
      {{ dateLabel }} · {{ store.name }} · {{ roleLabel }}
    </span>
    <h2 class="m-0 mega text-[clamp(28px,3.2vw,42px)] leading-none">Good to see you, <span class="text-outline">{{ firstName }}.</span></h2>
    <nav v-if="chips.length" aria-label="At a glance" class="flex flex-wrap gap-2">
      <NuxtLink
        v-for="c in chips"
        :key="c.label"
        :to="c.to"
        :class="['inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold no-underline transition-colors', c.strong ? 'bg-marigold text-on-marigold hover:brightness-95' : 'bg-surface text-ink ring-1 ring-line hover:ring-ink']"
      >
        <component :is="c.icon" class="size-4" aria-hidden="true" />{{ c.label }}
      </NuxtLink>
    </nav>
  </section>
</template>
