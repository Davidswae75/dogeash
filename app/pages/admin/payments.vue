<script setup lang="ts">
import { RotateCcw } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { DetailSection } from '~/components/DetailDialog.vue'
import type { AdminPayout, AdminRefund, AdminReservation, MoneyMoveStatus } from '~/composables/useAdminMoney'
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

// Everything about one reservation, refund or payout
const viewingRes = ref<AdminReservation>()
const resOpen = ref(false)
function openReservation(r: AdminReservation) {
  viewingRes.value = r
  resOpen.value = true
}
const resSections = computed<DetailSection[]>(() => {
  const r = viewingRes.value
  if (!r) return []
  return [
    { title: 'Reservation', rows: [
      { label: 'Reference', value: r.ref, mono: true },
      { label: 'Status', value: reservationStatus[r.status].label },
      { label: 'Dog', value: `${r.dog_name} · ${r.dog_file_no}`, to: `/dogs/${r.dog_file_no.toLowerCase()}`, external: true },
      { label: 'Started', value: adminTime(r.created_at) },
      { label: 'Hold ends', value: r.status === 'held' ? adminTime(r.expires_at) : null },
      { label: 'Ended', value: r.closed_at ? adminTime(r.closed_at) : null },
      { label: 'Ended by', value: r.closed_by },
      { label: 'Why it ended', value: r.close_reason, long: true },
    ] },
    { title: 'Money', rows: [
      { label: 'Price', value: formatMoney(r.price_naira), mono: true },
      { label: 'Deposit', value: formatMoney(r.deposit_naira), mono: true },
      { label: 'Paid so far', value: formatMoney(r.paid_naira), mono: true },
      { label: 'Deposit decision', value: r.money_decision === 'waiting' ? 'Waiting for Dogeash' : r.money_decision === 'refund' ? 'Refunded to the buyer' : r.money_decision === 'release' ? 'Released to the store' : null },
    ] },
    { title: 'People', rows: [
      { label: 'Store', value: r.store_name, to: `/admin/stores/${r.store_id}` },
      { label: 'Buyer', value: r.buyer_name, to: `/admin/people/${r.buyer_id}` },
      { label: 'Buyer\'s email', value: r.buyer_email, mono: true },
    ] },
  ]
})
function decideFromDialog(decision: 'refund' | 'release') {
  resOpen.value = false
  startDecision(viewingRes.value!, decision)
}

type Move = { kind: 'refund', item: AdminRefund } | { kind: 'payout', item: AdminPayout }
const viewingMove = ref<Move>()
const moveOpen = ref(false)
function openMove(kind: 'refund' | 'payout', item: AdminRefund | AdminPayout) {
  viewingMove.value = { kind, item } as Move
  moveOpen.value = true
}
const moveSections = computed<DetailSection[]>(() => {
  const m = viewingMove.value
  if (!m) return []
  const i = m.item
  const extra = m.kind === 'refund'
    ? [{ label: 'Why', value: m.item.reason, long: true }]
    : [{ label: 'Store', value: m.item.store_name, to: `/admin/stores/${m.item.store_id}` }, { label: 'Bank account', value: m.item.has_account ? 'Added' : 'Not added yet: sent once they add one' }]
  return [{ rows: [
    { label: 'Reservation', value: `${i.dog_name} · ${i.ref}`, mono: true },
    { label: 'Amount', value: formatMoney(i.amount_naira), mono: true },
    { label: 'Status', value: moveState[i.status].label },
    { label: 'Created', value: adminTime(i.created_at) },
    { label: m.kind === 'refund' ? 'Refunded' : 'Paid out', value: i.done_at ? adminTime(i.done_at) : null },
    ...extra,
    { label: 'What went wrong', value: i.failure, long: true },
  ] }]
})
const canRetry = computed(() => {
  const m = viewingMove.value
  if (!m) return false
  return (m.item.status === 'failed' || m.item.status === 'due') && (m.kind === 'refund' || m.item.has_account)
})

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
        <table v-if="tab !== 'refunds' && tab !== 'payouts' && rows.length" class="w-full min-w-[560px] border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="px-5 py-2.5 font-medium">Reservation</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Paid</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Status</th>
              <th scope="col" class="w-48"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <!-- A row shows the essentials; clicking it opens everything about the reservation -->
            <tr v-for="r in rows" :key="r.id" class="cursor-pointer align-top hover:bg-surface-sunk/60" @click="openReservation(r)">
              <td class="border-t border-line px-5 py-2.5">
                <button type="button" class="block cursor-pointer border-0 bg-transparent p-0 text-left text-ink hover:underline" @click.stop="openReservation(r)">{{ r.dog_name }}</button>
                <span class="font-mono text-[11px] text-ink-muted">{{ r.ref }} · {{ r.store_name }}</span>
              </td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono whitespace-nowrap tabular-nums">{{ formatMoney(r.paid_naira) }}</td>
              <td class="border-t border-line px-3 py-2.5">
                <span class="text-xs font-semibold">{{ r.money_decision === 'waiting' ? 'Needs a decision' : reservationStatus[r.status].label }}</span>
              </td>
              <td class="border-t border-line pr-4 text-right" @click.stop>
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
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Amount</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Status</th>
              <th scope="col" class="w-28"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in refunds" :key="f.id" class="cursor-pointer align-top hover:bg-surface-sunk/60" @click="openMove('refund', f)">
              <td class="border-t border-line px-5 py-2.5">
                <button type="button" class="block cursor-pointer border-0 bg-transparent p-0 text-left text-ink hover:underline" @click.stop="openMove('refund', f)">{{ f.dog_name }}</button>
                <span class="font-mono text-[11px] text-ink-muted">{{ f.ref }} · {{ shortTime(f.created_at) }}</span>
              </td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono tabular-nums">{{ formatMoney(f.amount_naira) }}</td>
              <td :class="['border-t border-line px-3 py-2.5 text-xs', moveState[f.status].tone]">{{ moveState[f.status].label }}</td>
              <td class="border-t border-line pr-4 text-right" @click.stop>
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
            <tr v-for="o in payouts" :key="o.id" class="cursor-pointer align-top hover:bg-surface-sunk/60" @click="openMove('payout', o)">
              <td class="border-t border-line px-5 py-2.5">
                <button type="button" class="block cursor-pointer border-0 bg-transparent p-0 text-left text-ink hover:underline" @click.stop="openMove('payout', o)">{{ o.dog_name }}</button>
                <span class="font-mono text-[11px] text-ink-muted">{{ o.ref }} · {{ shortTime(o.created_at) }}</span>
              </td>
              <td class="border-t border-line px-3 py-2.5">{{ o.store_name }}<span v-if="!o.has_account && o.status !== 'done'" class="block text-[11.5px] text-ink-muted">No bank account yet</span></td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono tabular-nums">{{ formatMoney(o.amount_naira) }}</td>
              <td :class="['border-t border-line px-3 py-2.5 text-xs', moveState[o.status].tone]">{{ moveState[o.status].label }}</td>
              <td class="border-t border-line pr-4 text-right" @click.stop>
                <Button v-if="o.has_account && (o.status === 'failed' || o.status === 'due')" variant="outline" size="sm" class="mt-1 h-8" :loading="retrying === o.id" @click="retry('payout', o.id)"><RotateCcw aria-hidden="true" />Retry</Button>
              </td>
            </tr>
          </tbody>
        </table>
        <ListSkeleton v-else-if="!loaded" variant="table" :rows="5" />
        <p v-else class="m-0 px-5 py-4 text-[13px] text-ink-muted">{{ tab === 'waiting' ? 'No deposits waiting for a decision.' : 'Nothing here yet.' }}</p>
      </div>
    </AdminCard>

    <DetailDialog v-if="viewingRes" v-model:open="resOpen" :title="`${viewingRes.dog_name} · ${viewingRes.ref}`" :subtitle="`${viewingRes.store_name} · ${viewingRes.buyer_name}`" :sections="resSections">
      <template v-if="viewingRes.money_decision === 'waiting'" #actions>
        <Button variant="outline" @click="decideFromDialog('refund')">Refund</Button>
        <Button variant="marigold" @click="decideFromDialog('release')">Release</Button>
      </template>
    </DetailDialog>
    <DetailDialog v-if="viewingMove" v-model:open="moveOpen" :title="`${viewingMove.kind === 'refund' ? 'Refund' : 'Payout'} · ${viewingMove.item.dog_name}`" :subtitle="viewingMove.item.ref" :sections="moveSections">
      <template v-if="canRetry" #actions>
        <Button variant="outline" :loading="retrying === viewingMove.item.id" @click="retry(viewingMove.kind, viewingMove.item.id)"><RotateCcw aria-hidden="true" />Retry</Button>
      </template>
    </DetailDialog>

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
