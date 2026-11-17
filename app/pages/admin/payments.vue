<script setup lang="ts">
import { RotateCcw } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { DetailSection } from '~/components/DetailDialog.vue'
import type { DataColumn } from '~/components/list/ListTable.vue'
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
const waiting = computed(() => reservations.value.filter(r => r.money_decision === 'waiting'))
const progress = computed(() => reservations.value.filter(r => r.status === 'held' || r.status === 'paid'))
const tabs = computed(() => [
  { value: 'waiting' as const, label: 'Needs a decision', count: waiting.value.length, urgent: true },
  { value: 'progress' as const, label: 'In progress', count: progress.value.length },
  { value: 'all' as const, label: 'All', count: reservations.value.length },
  { value: 'refunds' as const, label: 'Refunds', count: refunds.value.length, urgent: refunds.value.some(f => f.status === 'failed') },
  { value: 'payouts' as const, label: 'Payouts', count: payouts.value.length, urgent: payouts.value.some(o => o.status === 'failed') },
])
// A search over the dog, the reference and the store, in whichever tab is open
const query = ref('')
const match = (...parts: (string | undefined)[]) => {
  const q = query.value.trim().toLowerCase()
  return !q || parts.join(' ').toLowerCase().includes(q)
}
const rows = computed(() => (tab.value === 'waiting' ? waiting.value : tab.value === 'progress' ? progress.value : reservations.value).filter(r => match(r.dog_name, r.ref, r.store_name)))
const refundRows = computed(() => refunds.value.filter(f => match(f.dog_name, f.ref)))
const payoutRows = computed(() => payouts.value.filter(o => match(o.dog_name, o.ref, o.store_name)))
const shownCount = computed(() => (tab.value === 'refunds' ? refundRows.value.length : tab.value === 'payouts' ? payoutRows.value.length : rows.value.length))
const resColumns: DataColumn[] = [
  { key: 'dog', label: 'Reservation', mobile: 'title' },
  { key: 'store_name', label: 'Store', mobile: 'meta' },
  { key: 'paid', label: 'Paid', align: 'right', mono: true, mobile: 'end' },
  { key: 'state', label: 'Status', mobile: 'row' },
]
const moveColumns: DataColumn[] = [
  { key: 'dog', label: 'For', mobile: 'title' },
  { key: 'store', label: 'Store', mobile: 'meta' },
  { key: 'amount', label: 'Amount', align: 'right', mono: true, mobile: 'end' },
  { key: 'state', label: 'Status', mobile: 'row' },
]
const resKey = (r: AdminReservation) => r.id
const moveKey = (m: AdminRefund | AdminPayout) => m.id
const asPayout = (m: AdminRefund | AdminPayout) => m as AdminPayout

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
    </template>

    <dl v-if="tiles.length" class="m-0 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <div v-for="t in tiles" :key="t.label" class="flex min-w-0 flex-col gap-1 rounded-2xl bg-surface p-4 ring-1 ring-line">
        <dt class="text-[12px] text-ink-muted">{{ t.label }}</dt>
        <dd class="m-0 truncate font-mono text-xl font-semibold tabular-nums">{{ t.value }}</dd>
        <dd class="m-0 text-[11.5px] text-ink-muted">{{ t.hint }}</dd>
      </div>
    </dl>

    <ListToolbar v-model:search="query" placeholder="Dog, reference or store" :count="shownCount" :noun="['item', 'items']" :filtered="!!query.trim()" @clear="query = ''">
      <template #tabs><ListTabs v-model="tab" :tabs="tabs" label="Show" /></template>
    </ListToolbar>

    <ListSkeleton v-if="!loaded" variant="table" :rows="5" />
    <p v-else-if="!shownCount" class="m-0 rounded-xl bg-surface px-5 py-8 text-center text-sm text-ink-muted ring-1 ring-line">{{ query ? 'Nothing matches.' : tab === 'waiting' ? 'No deposits waiting for a decision.' : 'Nothing here yet.' }}</p>

    <!-- Reservations: a row opens everything about it -->
    <ListTable v-else-if="tab !== 'refunds' && tab !== 'payouts'" :rows="rows" :columns="resColumns" :row-key="resKey" min-width="620px" @open="openReservation">
      <template #cell-dog="{ row }"><span class="flex flex-col leading-tight"><strong class="font-semibold">{{ row.dog_name }}</strong><span class="font-mono text-[11px] text-ink-muted">{{ row.ref }}</span></span></template>
      <template #cell-paid="{ row }">{{ formatMoney(row.paid_naira) }}</template>
      <template #cell-state="{ row }">
        <span :class="['rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', row.money_decision === 'waiting' ? 'bg-marigold-soft text-ink' : 'bg-surface-sunk text-ink-muted']">{{ row.money_decision === 'waiting' ? 'Needs a decision' : reservationStatus[row.status as AdminReservation['status']].label }}</span>
      </template>
      <template #actions="{ row }">
        <span v-if="row.money_decision === 'waiting'" class="flex justify-end gap-1.5">
          <Button variant="outline" size="sm" class="h-8" @click="startDecision(row, 'refund')">Refund</Button>
          <Button variant="outline" size="sm" class="h-8" @click="startDecision(row, 'release')">Release</Button>
        </span>
      </template>
    </ListTable>

    <!-- Refunds and payouts -->
    <ListTable v-else :rows="tab === 'refunds' ? refundRows : payoutRows" :columns="tab === 'refunds' ? moveColumns.filter(c => c.key !== 'store') : moveColumns" :row-key="moveKey" min-width="620px" @open="m => openMove(tab === 'refunds' ? 'refund' : 'payout', m as never)">
      <template #cell-dog="{ row }"><span class="flex flex-col leading-tight"><strong class="font-semibold">{{ row.dog_name }}</strong><span class="font-mono text-[11px] text-ink-muted">{{ row.ref }} · {{ shortTime(row.created_at) }}</span></span></template>
      <template #cell-store="{ row }">{{ asPayout(row).store_name }}<span v-if="!asPayout(row).has_account && row.status !== 'done'" class="block text-[11.5px] text-ink-muted">No bank account yet</span></template>
      <template #cell-amount="{ row }">{{ formatMoney(row.amount_naira) }}</template>
      <template #cell-state="{ row }"><span :class="['text-xs capitalize', moveState[row.status as MoneyMoveStatus].tone]">{{ moveState[row.status as MoneyMoveStatus].label }}</span></template>
      <template #actions="{ row }">
        <Button v-if="(row.status === 'failed' || row.status === 'due') && (tab === 'refunds' || asPayout(row).has_account)" variant="outline" size="sm" class="h-8" :loading="retrying === row.id" @click="retry(tab === 'refunds' ? 'refund' : 'payout', row.id)"><RotateCcw aria-hidden="true" />Retry</Button>
      </template>
    </ListTable>

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
