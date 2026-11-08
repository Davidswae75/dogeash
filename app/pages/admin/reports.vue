<script setup lang="ts">
import { ArrowUpRight, MessagesSquare } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { AdminReport } from '~/composables/useAdminReports'
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
const tabModel = computed({ get: () => tab.value, set: (v: string) => { if (v) tab.value = v as 'open' | 'closed' } })
const shown = computed(() => reports.value.filter(r => (tab.value === 'open' ? r.status === 'open' : r.status !== 'open')))

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
      <ToggleGroup v-model="tabModel" type="single" variant="outline" size="sm" aria-label="Show reports" class="max-w-full flex-wrap justify-start">
        <ToggleGroupItem value="open" class="px-2.5 text-xs">Open <span class="ml-1 font-mono text-ink-muted">{{ openCount }}</span></ToggleGroupItem>
        <ToggleGroupItem value="closed" class="px-2.5 text-xs">Closed</ToggleGroupItem>
      </ToggleGroup>
    </template>

    <div v-if="shown.length" class="flex flex-col gap-3">
      <AdminCard v-for="r in shown" :key="r.id">
        <div class="flex flex-col gap-3 pt-4">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="rounded-full bg-surface-sunk px-2 py-0.5 font-mono text-[11px] font-semibold uppercase">{{ reportKinds[r.kind] }}</span>
            <span class="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">{{ reasonLabel(r.reason) }}</span>
            <span v-if="r.open_on_target > 1" class="text-xs font-semibold">{{ r.open_on_target }} open reports on this</span>
            <span class="ml-auto font-mono text-[11px] text-ink-muted">{{ adminTime(r.created_at) }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <strong class="text-[14.5px] font-semibold">{{ r.target.label }}</strong>
            <span class="font-mono text-[11px] text-ink-muted">({{ r.target.status.replace('_', ' ') }})</span>
            <NuxtLink v-if="r.target.link && r.kind !== 'conversation'" :to="r.target.link" class="inline-flex items-center gap-1 text-[13px] font-semibold text-ink">Act in {{ reportKinds[r.kind] === 'Listing' ? 'Listings' : `${reportKinds[r.kind]}s` }}<ArrowUpRight class="size-3.5" aria-hidden="true" /></NuxtLink>
          </div>
          <p v-if="r.details" class="m-0 text-[14px] leading-[21px]">"{{ r.details }}"</p>
          <span class="text-[12.5px] text-ink-muted">Reported by {{ r.reporter }} · {{ r.reporter_email }}</span>

          <!-- A reported conversation, read on request -->
          <template v-if="r.kind === 'conversation'">
            <Button v-if="!thread[r.id]" variant="outline" size="sm" class="w-fit" @click="read(r)"><MessagesSquare aria-hidden="true" />Read the conversation <span class="font-normal text-ink-muted">(logged)</span></Button>
            <ol v-else class="m-0 flex max-h-72 list-none flex-col gap-1.5 overflow-y-auto rounded-lg bg-surface-sunk p-3">
              <li v-for="(m, i) in thread[r.id]" :key="i" class="text-[13px] leading-[19px]">
                <span class="font-mono text-[10.5px] text-ink-muted uppercase">{{ m.from }} · {{ adminTime(m.at) }}</span><br>{{ m.body }}
              </li>
              <li v-if="!thread[r.id]!.length" class="text-[13px] text-ink-muted">No messages.</li>
            </ol>
          </template>

          <p v-if="r.status !== 'open'" class="m-0 rounded-lg bg-surface-sunk px-3 py-2 text-[13px]"><strong class="font-semibold">{{ r.status === 'resolved' ? 'Resolved' : 'Dismissed' }}{{ r.resolved_at ? ` ${adminTime(r.resolved_at)}` : '' }}:</strong> {{ r.resolution }}</p>
          <div v-else class="flex gap-2 border-t border-line pt-3">
            <Button variant="marigold" size="sm" @click="ask(r, 'resolved')">Resolve</Button>
            <Button variant="ghost" size="sm" @click="ask(r, 'dismissed')">Dismiss</Button>
          </div>
        </div>
      </AdminCard>
    </div>
    <ListSkeleton v-else-if="!loaded" variant="card" :rows="3" />
    <p v-else class="m-0 text-sm text-ink-muted">{{ tab === 'open' ? 'No open reports.' : 'No closed reports yet.' }}</p>

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
