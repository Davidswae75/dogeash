<script setup lang="ts">
import { RotateCcw } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { AdminReservation, MoneyMoveStatus } from '~/composables/useAdminMoney'
import type { CsvColumn } from '~/utils/csv'
import { useAdminMoney } from '~/composables/useAdminMoney'
import { useNotify } from '~/composables/useNotify'
import { adminTime } from '~/utils/admin'
import { formatMoney, moneyRules, reservationStatus } from '~/utils/reservations'
import { shortTime } from '~/utils/time'

// Admin › Payments: what Dogeash holds, deposits waiting for a decision (after a buyer cancelled or a hold ran
// out), every reservation with money on it, and refunds and payouts, with a retry for any that failed.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Payments · Dogeash admin', robots: 'noindex' })

const money = useAdminMoney()
const { reservations, refunds, payouts, totals, loaded } = money
onMounted(money.load)

type Tab = 'waiting' | 'progress' | 'all' | 'refunds' | 'payouts'
const tab = ref<Tab>('waiting')
const tabModel = computed({ get: () => tab.value, set: (v: string) => { if (v) tab.value = v as Tab } })
const waiting = computed(() => reservations.value.filter(r => r.money_decision === 'waiting'))
const progress = computed(() => reservations.value.filter(r => r.status === 'held' || r.status === 'paid'))
const tabs = computed(() => [
  { value: 'waiting' as const, label: 'Needs a decision', n: waiting.value.length },
  { value: 'progress' as const, label: 'In progress', n: progress.value.length },
  { value: 'all' as const, label: 'All', n: reservations.value.length },
  { value: 'refunds' as const, label: 'Refunds', n: refunds.value.length },
  { value: 'payouts' as const, label: 'Payouts', n: payouts.value.length },
])
const rows = computed(() => (tab.value === 'waiting' ? waiting.value : tab.value === 'progress' ? progress.value : reservations.value))

const tiles = computed(() => totals.value
  ? [
      { label: 'Held by Dogeash', value: formatMoney(totals.value.held), hint: 'Sales in progress and deposits waiting' },
      { label: 'Commission earned', value: formatMoney(totals.value.commission), hint: `${moneyRules.commissionPercent}% of completed sales` },
      { label: 'Paid to stores', value: formatMoney(totals.value.paidOut), hint: `Refunded to buyers: ${formatMoney(totals.value.refunded)}` },
      { label: 'Needs attention', value: String(totals.value.waiting + totals.value.stuck), hint: `${totals.value.waiting} decisions · ${totals.value.stuck} refunds or payouts not sent` },
    ]
  : [])

const moveState: Record<MoneyMoveStatus, { label: string, tone: string }> = {
  due: { label: 'due', tone: 'text-ink' },
  sending: { label: 'sending', tone: 'text-ink' },
  done: { label: 'done', tone: 'text-ink-muted' },
  failed: { label: 'failed', tone: 'text-danger font-semibold' },
}

// Deciding on a deposit
const deciding = ref<{ r: AdminReservation, decision: 'refund' | 'release' }>()
const decideOpen = ref(false)
function startDecision(r: AdminReservation, decision: 'refund' | 'release') {
  deciding.value = { r, decision }
  decideOpen.value = true
}
const decideCopy = computed(() => {
  const d = deciding.value
  if (!d) return { title: '', description: '' }
  const keep = Math.round(d.r.paid_naira * moneyRules.commissionPercent / 100)
  return d.decision === 'refund'
    ? { title: `Refund ${d.r.buyer_name}?`, description: `${formatMoney(d.r.paid_naira)} goes back to the buyer through Paystack. ${d.r.store_name} gets nothing.` }
    : { title: `Release the deposit to ${d.r.store_name}?`, description: `${formatMoney(d.r.paid_naira - keep)} goes to the store (Dogeash keeps ${formatMoney(keep)}). The buyer gets nothing back.` }
})
async function decide(note: string) {
  const d = deciding.value!
  const error = await money.decide(d.r.id, d.decision, note)
  if (!error) useNotify().adminDone(d.decision === 'refund' ? 'Refund sent' : 'Deposit released', `${d.r.ref}. Both sides have been told. It's in the audit log.`)
  return error
}

const retrying = ref('')
async function retry(kind: 'refund' | 'payout', id: string) {
  retrying.value = id
  const error = await money.retry(kind, id)
  retrying.value = ''
  if (error) useNotify().failed(error)
}

const csv: CsvColumn<AdminReservation>[] = [
  { label: 'Reference', value: r => r.ref }, { label: 'Dog', value: r => r.dog_name }, { label: 'File number', value: r => r.dog_file_no },
  { label: 'Store', value: r => r.store_name }, { label: 'Buyer', value: r => r.buyer_name }, { label: 'Buyer email', value: r => r.buyer_email },
  { label: 'Price (NGN)', value: r => r.price_naira }, { label: 'Paid (NGN)', value: r => r.paid_naira }, { label: 'Status', value: r => r.status },
  { label: 'Deposit decision', value: r => r.money_decision }, { label: 'Ended because', value: r => r.close_reason }, { label: 'Started', value: r => r.created_at },
]
</script>

<template>
  <AdminPage title="Payments" :count="waiting.length" description="Deposits, balances, refunds and payouts. Dogeash holds buyers' money until the handover, and decides on deposits when a sale falls through.">
    <template #actions>
      <AdminExport name="reservations" :rows="rows" :columns="csv" />
      <ToggleGroup v-model="tabModel" type="single" variant="outline" size="sm" aria-label="Show" class="flex-wrap">
        <ToggleGroupItem v-for="t in tabs" :key="t.value" :value="t.value" class="px-2.5 text-xs">{{ t.label }} <span class="ml-1 font-mono text-ink-muted">{{ t.n }}</span></ToggleGroupItem>
      </ToggleGroup>
    </template>

    <dl v-if="tiles.length" class="m-0 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <div v-for="t in tiles" :key="t.label" class="flex min-w-0 flex-col gap-1 rounded-2xl bg-surface p-4 ring-1 ring-line">
        <dt class="text-[12px] text-ink-muted">{{ t.label }}</dt>
        <dd class="m-0 truncate font-mono text-xl font-semibold tabular-nums">{{ t.value }}</dd>
        <dd class="m-0 text-[11.5px] text-ink-muted">{{ t.hint }}</dd>
      </div>
    </dl>

    <AdminCard flush>
      <div class="relative overflow-x-auto">
        <!-- Reservations -->
        <table v-if="tab !== 'refunds' && tab !== 'payouts' && rows.length" class="w-full min-w-[820px] border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="px-5 py-2.5 font-medium">Reservation</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Store</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Buyer</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Paid</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Status</th>
              <th scope="col" class="w-48"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="align-top hover:bg-surface-sunk/60">
              <td class="border-t border-line px-5 py-2.5">
                <span class="block">{{ r.dog_name }}</span>
                <span class="font-mono text-[11px] text-ink-muted" :title="adminTime(r.created_at)">{{ r.ref }} · {{ shortTime(r.created_at) }}</span>
              </td>
              <td class="border-t border-line px-3 py-2.5"><NuxtLink :to="`/admin/stores/${r.store_id}`" class="text-ink hover:underline">{{ r.store_name }}</NuxtLink></td>
              <td class="border-t border-line px-3 py-2.5">
                <NuxtLink :to="`/admin/people/${r.buyer_id}`" class="flex flex-col leading-tight text-ink no-underline hover:underline"><span>{{ r.buyer_name }}</span><span class="font-mono text-[11px] text-ink-muted">{{ r.buyer_email }}</span></NuxtLink>
              </td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono whitespace-nowrap tabular-nums">{{ formatMoney(r.paid_naira) }}<span class="block text-[11px] text-ink-muted">of {{ formatMoney(r.price_naira) }}</span></td>
              <td class="border-t border-line px-3 py-2.5">
                <span class="text-xs font-semibold">{{ reservationStatus[r.status].label }}</span>
                <span v-if="r.close_reason" class="block max-w-[22em] text-[11.5px] text-ink-muted">{{ r.closed_by === 'buyer' ? 'Buyer: ' : r.closed_by === 'store' ? 'Store: ' : '' }}{{ r.close_reason }}</span>
                <span v-if="r.money_decision && r.money_decision !== 'waiting'" class="block text-[11.5px] text-ink-muted">Deposit {{ r.money_decision === 'refund' ? 'refunded' : 'released' }}</span>
              </td>
              <td class="border-t border-line pr-4 text-right">
                <div v-if="r.money_decision === 'waiting'" class="mt-1 flex justify-end gap-1.5">
                  <Button variant="outline" size="sm" class="h-8" @click="startDecision(r, 'refund')">Refund</Button>
                  <Button variant="outline" size="sm" class="h-8" @click="startDecision(r, 'release')">Release</Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Refunds and payouts -->
        <table v-else-if="tab === 'refunds' && refunds.length" class="w-full min-w-[680px] border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="px-5 py-2.5 font-medium">For</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Why</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Amount</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Status</th>
              <th scope="col" class="w-28"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in refunds" :key="f.id" class="align-top">
              <td class="border-t border-line px-5 py-2.5">{{ f.dog_name }}<span class="block font-mono text-[11px] text-ink-muted">{{ f.ref }} · {{ shortTime(f.created_at) }}</span></td>
              <td class="border-t border-line px-3 py-2.5 text-ink-muted">{{ f.reason }}<span v-if="f.failure" class="block text-[11.5px] text-danger">{{ f.failure }}</span></td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono tabular-nums">{{ formatMoney(f.amount_naira) }}</td>
              <td :class="['border-t border-line px-3 py-2.5 text-xs', moveState[f.status].tone]">{{ moveState[f.status].label }}</td>
              <td class="border-t border-line pr-4 text-right">
                <Button v-if="f.status === 'failed' || f.status === 'due'" variant="outline" size="sm" class="mt-1 h-8" :loading="retrying === f.id" @click="retry('refund', f.id)"><RotateCcw aria-hidden="true" />Retry</Button>
              </td>
            </tr>
          </tbody>
        </table>
        <table v-else-if="tab === 'payouts' && payouts.length" class="w-full min-w-[680px] border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="px-5 py-2.5 font-medium">For</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Store</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Amount</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Status</th>
              <th scope="col" class="w-28"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in payouts" :key="o.id" class="align-top">
              <td class="border-t border-line px-5 py-2.5">{{ o.dog_name }}<span class="block font-mono text-[11px] text-ink-muted">{{ o.ref }} · {{ shortTime(o.created_at) }}</span></td>
              <td class="border-t border-line px-3 py-2.5">
                <NuxtLink :to="`/admin/stores/${o.store_id}`" class="text-ink hover:underline">{{ o.store_name }}</NuxtLink>
                <span v-if="!o.has_account && o.status !== 'done'" class="block text-[11.5px] text-ink-muted">No bank account yet: sent once they add one</span>
                <span v-if="o.failure" class="block text-[11.5px] text-danger">{{ o.failure }}</span>
              </td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono tabular-nums">{{ formatMoney(o.amount_naira) }}</td>
              <td :class="['border-t border-line px-3 py-2.5 text-xs', moveState[o.status].tone]">{{ moveState[o.status].label }}</td>
              <td class="border-t border-line pr-4 text-right">
                <Button v-if="o.has_account && (o.status === 'failed' || o.status === 'due')" variant="outline" size="sm" class="mt-1 h-8" :loading="retrying === o.id" @click="retry('payout', o.id)"><RotateCcw aria-hidden="true" />Retry</Button>
              </td>
            </tr>
          </tbody>
        </table>
        <ListSkeleton v-else-if="!loaded" variant="table" :rows="5" />
        <p v-else class="m-0 px-5 py-4 text-[13px] text-ink-muted">{{ tab === 'waiting' ? 'No deposits waiting for a decision.' : 'Nothing here yet.' }}</p>
      </div>
    </AdminCard>

    <AdminConfirm
      v-if="deciding"
      v-model:open="decideOpen"
      :title="decideCopy.title"
      :description="decideCopy.description"
      :confirm-label="deciding.decision === 'refund' ? 'Refund the buyer' : 'Release to the store'"
      reason-for="the buyer"
      :run="decide"
    />
  </AdminPage>
</template>
