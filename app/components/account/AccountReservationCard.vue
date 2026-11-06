<script setup lang="ts">
import { Check, Clock } from '@lucide/vue'
import { computed } from 'vue'
import type { Reservation } from '~/utils/reservations'
import { cn } from '~/lib/utils'
import { formatMoney, moneyNote, reservationStatus, reservationSteps, timeLeft } from '~/utils/reservations'

// One reservation: the dog, where it stands (deposit, balance, handover), the money, and a slot for actions
const props = defineProps<{ reservation: Reservation, muted?: boolean }>()
const r = computed(() => props.reservation)
const status = computed(() => reservationStatus[r.value.status])
const steps = computed(() => reservationSteps(r.value))
const note = computed(() => moneyNote(r.value))
const when = (iso: string) => new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
// The balance only matters while the reservation is in play
const showDue = computed(() => r.value.status === 'held' || r.value.status === 'paid')
const due = computed(() => (r.value.status === 'held' ? r.value.balanceNaira : 0))
</script>

<template>
  <article :class="cn('flex flex-col gap-4 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5', props.muted && 'bg-transparent')">
    <div class="flex items-start gap-4">
      <AccountDogPortrait :name="r.dogName" :photo="r.photo" class="size-16 sm:size-20" />
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink :to="`/dogs/${r.dogFileNo.toLowerCase()}`" class="font-display text-lg leading-6 font-extrabold text-ink no-underline font-stretch-expanded hover:underline">{{ r.dogName }}</NuxtLink>
          <span :class="['rounded-full px-2.5 py-0.5 text-xs font-bold', status.tone]">{{ status.label }}</span>
        </div>
        <span class="text-sm text-ink-muted">{{ r.storeName }} · <span class="font-mono text-[12.5px]">{{ r.ref }}</span></span>
        <span v-if="r.status === 'held'" class="flex items-center gap-1.5 text-sm font-semibold"><Clock class="size-4 text-marigold" aria-hidden="true" />Held until {{ when(r.expiresAt) }} · {{ timeLeft(r.expiresAt) }}</span>
        <span v-else-if="r.status === 'completed' && r.completedAt" class="text-sm text-ink-muted">Handed over {{ when(r.completedAt) }}</span>
        <span v-else-if="r.closedAt" class="text-sm text-ink-muted">Ended {{ when(r.closedAt) }}{{ r.closeReason ? ` · ${r.closeReason}` : '' }}</span>
      </div>
    </div>

    <!-- Deposit → balance → handover -->
    <ol v-if="r.depositPaidAt" class="m-0 grid list-none grid-cols-3 gap-1.5 p-0" aria-label="Progress">
      <li v-for="s in steps" :key="s.label" class="flex flex-col gap-1.5">
        <span :class="['h-1.5 rounded-full', s.done ? 'bg-marigold' : 'bg-surface-sunk ring-1 ring-line']" aria-hidden="true" />
        <span :class="['flex items-center gap-1 text-xs font-semibold', s.done ? 'text-ink' : 'text-ink-muted']">
          <Check v-if="s.done" class="size-3.5" aria-hidden="true" />{{ s.label }}<span class="sr-only">{{ s.done ? ', done' : ', to do' }}</span>
        </span>
      </li>
    </ol>

    <dl :class="['m-0 grid gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line', showDue ? 'grid-cols-3' : 'grid-cols-2']">
      <div class="flex min-w-0 flex-col gap-0.5 bg-surface px-2.5 py-2.5 sm:px-3">
        <dt class="font-mono text-[10px] font-semibold tracking-[.12em] text-ink-muted uppercase">Price</dt>
        <dd class="m-0 text-[13.5px] font-bold tabular-nums sm:text-[15px]">{{ formatMoney(r.priceNaira) }}</dd>
      </div>
      <div class="flex min-w-0 flex-col gap-0.5 bg-surface px-2.5 py-2.5 sm:px-3">
        <dt class="font-mono text-[10px] font-semibold tracking-[.12em] text-ink-muted uppercase">Paid</dt>
        <dd class="m-0 text-[13.5px] font-bold tabular-nums sm:text-[15px]">{{ formatMoney(r.paidNaira) }}</dd>
      </div>
      <div v-if="showDue" class="flex min-w-0 flex-col gap-0.5 bg-surface px-2.5 py-2.5 sm:px-3">
        <dt class="font-mono text-[10px] font-semibold tracking-[.12em] text-ink-muted uppercase">Due</dt>
        <dd :class="['m-0 text-[13.5px] font-bold tabular-nums sm:text-[15px]', due && 'text-marigold-ink dark:text-marigold']">{{ formatMoney(due) }}</dd>
      </div>
    </dl>

    <p v-if="note" class="m-0 rounded-lg bg-marigold-soft px-3.5 py-2.5 text-sm leading-[21px]">{{ note }}</p>

    <div v-if="$slots.default" class="flex flex-wrap gap-2">
      <slot />
    </div>
  </article>
</template>
