<script setup lang="ts">
import { ArrowUpRight, MessagesSquare } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { AdminReport } from '~/composables/useAdminReports'
import type { DetailSection } from '~/components/DetailDialog.vue'
import type { DataColumn } from '~/components/list/ListTable.vue'
import type { CsvColumn } from '~/utils/csv'
import { useAdminReports } from '~/composables/useAdminReports'
import { useNotify } from '~/composables/useNotify'
import { adminTime } from '~/utils/admin'
import { reasonLabel, reportKinds } from '~/utils/reports'

// Admin › Reports: what buyers and stores flagged. Each shows what it's about (with a link to act on it in its
// section), why, the reporter, and how many open reports the same thing has. A reported conversation can be
// read here; that's logged. Resolve (you acted) or dismiss (nothing to do), with a note the reporter reads.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Reports · Dogeash admin', robots: 'noindex' })

const { reports, openCount, loaded, load, messages, close } = useAdminReports()
onMounted(load)

const tab = ref<'open' | 'closed'>('open')
const tabs = computed(() => [
  { value: 'open' as const, label: 'Open', count: openCount.value, urgent: true },
  { value: 'closed' as const, label: 'Closed', count: reports.value.filter(r => r.status !== 'open').length },
])
// What was reported (listing, store, review…), and a search over it, the reason and who reported
type ReportKind = keyof typeof reportKinds
const kinds = ref<ReportKind[]>([])
const kindOptions = (Object.keys(reportKinds) as ReportKind[]).map(k => ({ value: k, label: reportKinds[k] }))
const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return reports.value
    .filter(r => (tab.value === 'open' ? r.status === 'open' : r.status !== 'open'))
    .filter(r => !kinds.value.length || kinds.value.includes(r.kind as ReportKind))
    .filter(r => !q || `${r.target.label} ${r.details ?? ''} ${r.reporter} ${reasonLabel(r.reason)}`.toLowerCase().includes(q))
})
function clearFilters() {
  kinds.value = []
  query.value = ''
}
const columns: DataColumn[] = [
  { key: 'what', label: 'Reported', mobile: 'title' },
  { key: 'reason', label: 'Reason', mobile: 'row' },
  { key: 'who', label: 'From', mobile: 'row' },
  { key: 'when', label: 'When', mobile: 'meta' },
]
const reportKey = (r: AdminReport) => r.id
const reportLabel = (r: AdminReport) => `${reportKinds[r.kind as ReportKind]} report: ${r.target.label}`

// Reading a reported conversation (on request, and logged)
const thread = ref<Record<string, { from: 'buyer' | 'store', body: string, at: string }[]>>({})
async function read(r: AdminReport) {
  thread.value = { ...thread.value, [r.id]: await messages(r) }
}

const pending = ref<{ report: AdminReport, outcome: 'resolved' | 'dismissed' }>()
const csv: CsvColumn<AdminReport>[] = [
  { label: 'Kind', value: r => reportKinds[r.kind] }, { label: 'About', value: r => r.target.label }, { label: 'Reason', value: r => reasonLabel(r.reason) },
  { label: 'Details', value: r => r.details }, { label: 'Reporter', value: r => r.reporter }, { label: 'Reporter email', value: r => r.reporter_email },
  { label: 'Status', value: r => r.status }, { label: 'Resolution', value: r => r.resolution }, { label: 'Reported', value: r => r.created_at },
]
const confirmOpen = ref(false)

// The whole report in a dialog, with the reported conversation when there is one
const viewing = ref<AdminReport>()
const viewOpen = ref(false)
function openReport(r: AdminReport) {
  viewing.value = r
  viewOpen.value = true
}
const reportSections = computed<DetailSection[]>(() => {
  const r = viewing.value
  if (!r) return []
  return [
    { title: 'Report', rows: [
      { label: 'About', value: `${reportKinds[r.kind]}: ${r.target.label}`, ...(r.target.link && r.kind !== 'conversation' ? { to: r.target.link } : {}) },
      { label: 'Its status now', value: r.target.status.replace('_', ' ') },
      { label: 'Reason', value: reasonLabel(r.reason) },
      { label: 'Reported', value: adminTime(r.created_at) },
      { label: 'Open reports on it', value: r.open_on_target > 1 ? String(r.open_on_target) : null },
      { label: 'What they said', value: r.details, long: true },
    ] },
    { title: 'Reporter', rows: [
      { label: 'Name', value: r.reporter },
      { label: 'Email', value: r.reporter_email, mono: true },
    ] },
    { title: 'Outcome', rows: [
      { label: r.status === 'resolved' ? 'Resolved' : 'Dismissed', value: r.status !== 'open' ? (r.resolved_at ? adminTime(r.resolved_at) : 'Yes') : null },
      { label: 'Note to the reporter', value: r.resolution, long: true },
    ] },
  ]
})
function decideFromDialog(outcome: 'resolved' | 'dismissed') {
  viewOpen.value = false
  ask(viewing.value!, outcome)
}
function ask(report: AdminReport, outcome: 'resolved' | 'dismissed') {
  pending.value = { report, outcome }
  confirmOpen.value = true
}
async function run(note: string) {
  const error = await close(pending.value!.report, pending.value!.outcome, note)
  if (!error) useNotify().adminDone(pending.value!.outcome === 'resolved' ? 'Report resolved' : 'Report dismissed', 'The reporter has your note.')
  return error
}
</script>

<template>
  <AdminPage title="Reports" :count="openCount" description="What buyers and stores flagged. Act on the thing itself in its section (take down, remove, suspend, block), then resolve here.">
    <template #actions>
      <AdminExport name="reports" :rows="shown" :columns="csv" />
    </template>

    <div class="flex flex-col gap-4">
      <ListToolbar v-model:search="query" placeholder="What, details, reporter or reason" :count="shown.length" :noun="['report', 'reports']" :filtered="!!kinds.length || !!query.trim()" @clear="clearFilters">
        <template #tabs><ListTabs v-model="tab" :tabs="tabs" label="Show reports" /></template>
        <template #filters><ListFilter v-model="kinds" label="Kind" :options="kindOptions" /></template>
      </ListToolbar>
      <ListSkeleton v-if="!loaded" variant="table" :rows="4" />
      <p v-else-if="!shown.length" class="m-0 rounded-xl bg-surface px-5 py-8 text-center text-sm text-ink-muted ring-1 ring-line">{{ query || kinds.length ? 'No reports match.' : tab === 'open' ? 'No open reports.' : 'No closed reports yet.' }}</p>
      <!-- A row opens the whole report, the conversation and what to do -->
      <ListTable v-else :rows="shown" :columns="columns" :row-key="reportKey" :row-label="reportLabel" min-width="820px" @open="openReport">
        <template #cell-what="{ row }">
          <span class="flex max-w-[360px] flex-col gap-1">
            <span class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-surface-sunk px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase">{{ reportKinds[row.kind as ReportKind] }}</span>
              <span v-if="row.open_on_target > 1" class="text-xs font-semibold text-danger">{{ row.open_on_target }} open on this</span>
            </span>
            <strong class="font-semibold">{{ row.target.label }}</strong>
            <span v-if="row.details" class="line-clamp-1 text-[12.5px] font-normal text-ink-muted">"{{ row.details }}"</span>
          </span>
        </template>
        <template #cell-reason="{ row }"><span class="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-danger">{{ reasonLabel(row.reason) }}</span></template>
        <template #cell-who="{ row }"><span class="text-ink-muted">{{ row.status === 'open' ? row.reporter : `${row.status === 'resolved' ? 'Resolved' : 'Dismissed'}${row.resolved_at ? ` ${adminTime(row.resolved_at)}` : ''}` }}</span></template>
        <template #cell-when="{ row }"><span class="font-mono text-[11.5px] whitespace-nowrap text-ink-muted">{{ adminTime(row.created_at) }}</span></template>
        <template #actions="{ row }">
          <span v-if="row.status === 'open'" class="flex justify-end gap-1.5">
            <Button variant="marigold" size="sm" class="h-8" @click="ask(row, 'resolved')">Resolve</Button>
            <Button variant="ghost" size="sm" class="h-8" @click="ask(row, 'dismissed')">Dismiss</Button>
          </span>
        </template>
      </ListTable>
    </div>

    <DetailDialog v-if="viewing" v-model:open="viewOpen" :title="`${reportKinds[viewing.kind]} report: ${reasonLabel(viewing.reason)}`" :subtitle="viewing.target.label" :sections="reportSections">
      <!-- A reported conversation, read on request (logged) -->
      <div v-if="viewing.kind === 'conversation'" class="flex flex-col gap-2">
        <Button v-if="!thread[viewing.id]" variant="outline" size="sm" class="w-fit" @click="read(viewing)"><MessagesSquare aria-hidden="true" />Read the conversation <span class="font-normal text-ink-muted">(logged)</span></Button>
        <ol v-else class="m-0 flex max-h-72 list-none flex-col gap-1.5 overflow-y-auto rounded-lg bg-surface-sunk p-3">
          <li v-for="(m, i) in thread[viewing.id]" :key="i" class="text-[13px] leading-[19px]">
            <span class="font-mono text-[10.5px] text-ink-muted uppercase">{{ m.from }} · {{ adminTime(m.at) }}</span><br>{{ m.body }}
          </li>
          <li v-if="!thread[viewing.id]!.length" class="text-[13px] text-ink-muted">No messages.</li>
        </ol>
      </div>
      <template #actions>
        <Button v-if="viewing.target.link && viewing.kind !== 'conversation'" as-child variant="ghost"><NuxtLink :to="viewing.target.link" :title="`Act on it in ${reportKinds[viewing.kind] === 'Listing' ? 'Listings' : `${reportKinds[viewing.kind]}s`}`">Open<ArrowUpRight aria-hidden="true" /></NuxtLink></Button>
        <template v-if="viewing.status === 'open'">
          <Button variant="ghost" @click="decideFromDialog('dismissed')">Dismiss</Button>
          <Button variant="marigold" @click="decideFromDialog('resolved')">Resolve</Button>
        </template>
      </template>
    </DetailDialog>

    <AdminConfirm
      v-if="pending"
      v-model:open="confirmOpen"
      :title="pending.outcome === 'resolved' ? 'Resolve this report?' : 'Dismiss this report?'"
      :description="pending.outcome === 'resolved' ? 'Say what you did (took the listing down, removed the review, suspended the store …). The reporter reads your note.' : 'Say why there\'s nothing to do. The reporter reads your note.'"
      :confirm-label="pending.outcome === 'resolved' ? 'Resolve' : 'Dismiss'"
      reason-required
      reason-for="the reporter"
      :run="run"
    />
  </AdminPage>
</template>
