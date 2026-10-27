<script setup lang="ts">
import { CalendarDays, MessageSquare, Wallet } from '@lucide/vue'

// Top of the overview: the day, who's here, and the three things worth knowing at a glance
const { store, roleLabel } = useStoreContext()
const { firstName } = useSession()
const activity = computed(() => storeActivity[store.value.id])

const chips = computed(() => [
  { icon: MessageSquare, label: `${activity.value?.enquiries ?? 0} enquiries waiting`, to: '/dashboard/inbox?type=message', strong: !!activity.value?.enquiries },
  { icon: CalendarDays, label: `${activity.value?.visitsToday ?? 0} visit today`, to: '/dashboard/bookings', strong: false },
  { icon: Wallet, label: '1 deposit in escrow', to: '/dashboard/bookings', strong: false },
])
</script>

<template>
  <section class="flex animate-rise flex-col gap-4">
    <span class="font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">
      {{ dashboardToday.label }} · {{ store.name }} · {{ roleLabel }}
    </span>
    <h2 class="m-0 mega text-[clamp(28px,3.2vw,42px)] leading-none">Good to see you, <span class="text-outline">{{ firstName }}.</span></h2>
    <nav aria-label="At a glance" class="flex flex-wrap gap-2">
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
