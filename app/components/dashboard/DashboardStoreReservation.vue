<script setup lang="ts">
import { Phone } from '@lucide/vue'
import { computed } from 'vue'
import type { StoreReservation } from '~/composables/useStoreMoney'
import { formatMoney, timeLeft } from '~/utils/reservations'

// One reservation on the store's dog, as the store sees it: the buyer (and their phone while there's a
// handover to arrange), where it stands, and what the store will receive
const props = defineProps<{ reservation: StoreReservation }>()
const r = computed(() => props.reservation)

const state = computed(() => {
  const x = r.value
  switch (x.status) {
    case 'held': return { label: 'Deposit paid', tone: 'bg-marigold text-on-marigold', text: `Waiting for the balance · ${timeLeft(x.expiresAt)}. The dog stays reserved until then.` }
    case 'paid': return { label: 'Paid in full', tone: 'bg-night text-marigold', text: 'Arrange the handover with the buyer. You\'re paid once they confirm it.' }
    case 'completed': return { label: 'Sold', tone: 'bg-ash-soft text-ink', text: 'Handed over. Your payout is below.' }
    case 'cancelled': return { label: x.closedBy === 'store' ? 'Cancelled by you' : 'Cancelled by the buyer', tone: 'bg-ash-soft text-ink-muted', text: moneyText(x) }
    default: return { label: 'Hold ended', tone: 'bg-ash-soft text-ink-muted', text: moneyText(x) }
  }
})
function moneyText(x: StoreReservation) {
  const why = x.closeReason ? `${x.closeReason}. ` : ''
  if (x.moneyDecision === 'waiting') return `${why}Dogeash is deciding what happens to the ${formatMoney(x.depositNaira)} deposit.`
  if (x.moneyDecision === 'release') return `${why}Dogeash released the deposit to you.`
  if (x.moneyDecision === 'refund') return `${why}The buyer was refunded.`
  return why
}
const when = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
</script>

<template>
  <article class="flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-line">
    <div class="flex items-start gap-3">
      <AccountDogPortrait :name="r.dogName" :photo="r.photo" class="size-14" />
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <div class="flex flex-wrap items-center gap-2">
          <strong class="font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">{{ r.dogName }}</strong>
          <span :class="['rounded-full px-2.5 py-0.5 text-xs font-bold', state.tone]">{{ state.label }}</span>
        </div>
        <span class="text-[13px] text-ink-muted">{{ r.buyerName }} · <span class="font-mono">{{ r.ref }}</span>{{ r.depositPaidAt ? ` · since ${when(r.depositPaidAt)}` : '' }}</span>
        <a v-if="r.buyerPhone" :href="`tel:${r.buyerPhone.replace(/\s/g, '')}`" class="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-ink"><Phone class="size-3.5" aria-hidden="true" />{{ r.buyerPhone }}</a>
      </div>
    </div>
    <p class="m-0 text-sm leading-[21px]">{{ state.text }}</p>
    <dl class="m-0 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line">
      <div class="flex min-w-0 flex-col gap-0.5 bg-surface px-2.5 py-2 sm:px-3">
        <dt class="font-mono text-[10px] font-semibold tracking-[.12em] text-ink-muted uppercase">Price</dt>
        <dd class="m-0 text-[13.5px] font-bold tabular-nums sm:text-[15px]">{{ formatMoney(r.priceNaira) }}</dd>
      </div>
      <div class="flex min-w-0 flex-col gap-0.5 bg-surface px-2.5 py-2 sm:px-3">
        <dt class="font-mono text-[10px] font-semibold tracking-[.12em] text-ink-muted uppercase">Paid</dt>
        <dd class="m-0 text-[13.5px] font-bold tabular-nums sm:text-[15px]">{{ formatMoney(r.paidNaira) }}</dd>
      </div>
      <div class="flex min-w-0 flex-col gap-0.5 bg-surface px-2.5 py-2 sm:px-3">
        <dt class="font-mono text-[10px] font-semibold tracking-[.12em] text-ink-muted uppercase">You get</dt>
        <dd class="m-0 text-[13.5px] font-bold tabular-nums sm:text-[15px]" :title="`The price less Dogeash's ${formatMoney(r.commissionNaira)}`">{{ formatMoney(r.priceNaira - r.commissionNaira) }}</dd>
      </div>
    </dl>
    <div v-if="$slots.default" class="flex flex-wrap gap-2"><slot /></div>
  </article>
</template>
