<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { StoreReservation, StorePayout } from '~/composables/useStoreMoney'
import { useStoreContext } from '~/composables/useStoreContext'
import { useStoreMoney } from '~/composables/useStoreMoney'
import { formatMoney, moneyRules } from '~/utils/reservations'

// Payouts: reservations on the store's dogs (owners and managers), what Dogeash holds and owes the store,
// the payouts sent, and the bank account they go to (owners). A store can cancel a reservation in
// progress; the buyer gets everything back.
definePageMeta({ layout: 'dashboard', title: 'Payouts', middleware: 'store-member' })
useSeoMeta({ title: 'Payouts · Store dashboard · Dogeash', robots: 'noindex' })

const { store } = useStoreContext()
const money = useStoreMoney()
const { reservations, payouts, account, loaded, canSeeMoney, canSeeReservations, totals, inProgress, finished, banks } = money
onMounted(money.load)

const tiles = computed(() => [
  { label: 'Held by Dogeash', value: totals.value.held, hint: 'Paid by buyers for sales in progress' },
  { label: 'Due to you', value: totals.value.due, hint: account.value ? 'On its way, or waiting to be sent' : 'Waiting for your bank account' },
  { label: 'Paid out', value: totals.value.paidOut, hint: 'Sent to your bank' },
])

const payoutState: Record<StorePayout['status'], { label: string, tone: string }> = {
  due: { label: 'Due', tone: 'text-ink' },
  sending: { label: 'Sending', tone: 'text-ink' },
  done: { label: 'Paid', tone: 'text-ink-muted' },
  failed: { label: 'Not sent yet', tone: 'text-danger' },
}
const when = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

// Cancelling: the buyer gets everything back, so the store says why
const cancelling = ref<StoreReservation>()
const reason = ref('')
const busy = ref(false)
const cancelError = ref('')
function startCancel(r: StoreReservation) {
  cancelling.value = r
  reason.value = ''
  cancelError.value = ''
}
async function confirmCancel() {
  busy.value = true
  cancelError.value = (await money.cancel(cancelling.value!.id, reason.value)) ?? ''
  busy.value = false
  if (!cancelError.value) cancelling.value = undefined
}
</script>

<template>
  <DashboardNoAccess v-if="!canSeeReservations" title="Payouts" />
  <div v-else class="flex flex-col gap-6">
    <p class="m-0 max-w-[48em] text-[15px] leading-6 text-ink-muted">
      Buyers reserve {{ store.name }}'s dogs with a {{ moneyRules.depositPercent }}% deposit and pay the rest through Dogeash. Dogeash holds the money until the buyer confirms the handover, then pays you the price less {{ moneyRules.commissionPercent }}%.
    </p>

    <dl v-if="canSeeMoney" class="m-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div v-for="t in tiles" :key="t.label" class="flex flex-col gap-1 rounded-xl bg-surface p-4 ring-1 ring-line">
        <dt class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ t.label }}</dt>
        <dd class="m-0 font-display text-2xl font-extrabold tabular-nums font-stretch-expanded">{{ formatMoney(t.value) }}</dd>
        <dd class="m-0 text-xs text-ink-muted">{{ t.hint }}</dd>
      </div>
    </dl>

    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div class="flex flex-col gap-5">
        <section class="flex flex-col gap-3" aria-labelledby="in-progress">
          <h2 id="in-progress" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">In progress · {{ inProgress.length }}</h2>
          <DashboardStoreReservation v-for="r in inProgress" :key="r.id" :reservation="r">
            <Button variant="ghost" size="sm" class="text-danger" @click="startCancel(r)">Cancel and refund the buyer</Button>
          </DashboardStoreReservation>
          <p v-if="!inProgress.length" class="m-0 rounded-xl bg-surface px-4 py-6 text-center text-sm text-ink-muted ring-1 ring-line">
            {{ loaded ? 'No dogs reserved right now. When a buyer pays a deposit, the dog shows here and is held for them.' : 'Loading…' }}
          </p>
        </section>

        <section v-if="finished.length" class="flex flex-col gap-3" aria-labelledby="finished">
          <h2 id="finished" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">Earlier · {{ finished.length }}</h2>
          <DashboardStoreReservation v-for="r in finished" :key="r.id" :reservation="r" />
        </section>
      </div>

      <div v-if="canSeeMoney" class="flex flex-col gap-5 self-start">
        <DashboardPayoutAccount :account="account" :banks="banks" :load-banks="money.loadBanks" :save="money.saveAccount" />

        <section class="flex flex-col gap-3 rounded-xl bg-surface p-5 ring-1 ring-line" aria-labelledby="payout-list">
          <h2 id="payout-list" class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Payouts</h2>
          <ul v-if="payouts.length" class="m-0 flex list-none flex-col divide-y divide-line p-0">
            <li v-for="p in payouts" :key="p.id" class="flex items-start justify-between gap-3 py-2.5">
              <span class="flex min-w-0 flex-col">
                <span class="truncate text-sm font-semibold">{{ p.reservations?.dog_name ?? 'Sale' }} <span class="font-mono text-[11.5px] font-normal text-ink-muted">{{ p.reservations?.ref }}</span></span>
                <span class="text-xs text-ink-muted">{{ when(p.done_at ?? p.created_at) }}<template v-if="p.status === 'failed'"> · Dogeash is looking into it</template></span>
              </span>
              <span class="flex shrink-0 flex-col items-end">
                <strong class="text-sm tabular-nums">{{ formatMoney(p.amount_naira) }}</strong>
                <span :class="['text-xs font-semibold', payoutState[p.status].tone]">{{ payoutState[p.status].label }}</span>
              </span>
            </li>
          </ul>
          <p v-else class="m-0 text-sm text-ink-muted">Nothing yet. You're paid when a buyer confirms the handover.</p>
        </section>
      </div>
    </div>

    <AlertDialog :open="!!cancelling" @update:open="o => !o && (cancelling = undefined)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel {{ cancelling?.dogName }}'s reservation?</AlertDialogTitle>
          <AlertDialogDescription>
            {{ cancelling?.buyerName }} gets back everything they paid ({{ formatMoney(cancelling?.paidNaira ?? 0) }}), and {{ cancelling?.dogName }} goes back on sale. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldShell label="Why" for="cancel-reason" hint="The buyer sees this.">
          <Textarea id="cancel-reason" v-model="reason" rows="2" maxlength="300" placeholder="The dog is unwell and can't travel this month" class="border-line-strong" />
        </FieldShell>
        <p v-if="cancelError" class="m-0 text-sm font-semibold text-danger" role="alert">{{ cancelError }}</p>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="busy">Keep it</AlertDialogCancel>
          <Button class="bg-danger text-white hover:bg-danger/90" :loading="busy" @click="confirmCancel">Cancel and refund</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
