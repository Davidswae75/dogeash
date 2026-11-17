<script setup lang="ts">
import { CalendarDays } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { DataColumn } from '~/components/list/ListTable.vue'
import type { Visit } from '~/composables/useVisits'
import { useStoreInbox } from '~/composables/useStoreInbox'
import { visitDogNames, visitStatusLabels } from '~/composables/useVisits'
import { visitDay } from '~/utils/time'

// Kennel visits for the store, one tab at a time: requests waiting for an answer and confirmed visits still to
// come (as cards, answered right there), then everything earlier (a table; a row opens the visit).
// The dashboard layout loads them with the inbox; deciding here is the same as deciding in the inbox.
definePageMeta({ layout: 'dashboard', title: 'Bookings', middleware: 'store-member' })
useSeoMeta({ title: 'Bookings · Store dashboard · Dogeash', robots: 'noindex' })

const { waiting, confirmed, earlier, decideVisit, loaded } = useStoreInbox()

type Tab = 'waiting' | 'confirmed' | 'earlier'
const tab = ref<Tab>('waiting')
// Nothing waiting: open on what's coming up
watch(loaded, (l) => { if (l && !waiting.value.length) tab.value = 'confirmed' }, { immediate: true })
const tabs = computed(() => [
  { value: 'waiting' as const, label: 'Waiting for you', count: waiting.value.length, urgent: true },
  { value: 'confirmed' as const, label: 'Coming up', count: confirmed.value.length },
  { value: 'earlier' as const, label: 'Earlier', count: earlier.value.length },
])
const query = ref('')
const matches = (v: Visit) => {
  const q = query.value.trim().toLowerCase()
  return !q || `${v.buyerName} ${v.service} ${visitDogNames(v.dogFileNos)} ${v.buyerPhone ?? ''}`.toLowerCase().includes(q)
}
const shown = computed(() => (tab.value === 'waiting' ? waiting.value : tab.value === 'confirmed' ? confirmed.value : earlier.value).filter(matches))

const columns: DataColumn[] = [
  { key: 'when', label: 'When', mobile: 'meta' },
  { key: 'buyerName', label: 'Buyer', mobile: 'title' },
  { key: 'service', label: 'Visit', mobile: 'row' },
  { key: 'dogs', label: 'Dogs', mobile: 'row' },
  { key: 'state', label: 'Status', mobile: 'end' },
]
const visitKey = (v: Visit) => v.id
const opened = ref<Visit>()
</script>

<template>
  <div class="flex flex-col gap-5">
    <p class="m-0 max-w-[44em] text-[15px] leading-6 text-ink-muted">
      Buyers ask to visit your kennel from your store and dog pages. Answer each request; they see your decision and note in their visits.
    </p>

    <ListToolbar v-model:search="query" placeholder="Buyer, visit, dog or phone" :count="shown.length" :noun="['visit', 'visits']" :filtered="!!query.trim()" @clear="query = ''">
      <template #tabs><ListTabs v-model="tab" :tabs="tabs" label="Show visits" /></template>
    </ListToolbar>

    <ListSkeleton v-if="!loaded" :rows="2" label="Loading visits" />

    <!-- Waiting and coming up: cards, answered right here -->
    <template v-else-if="tab !== 'earlier'">
      <div v-for="v in shown" :key="v.id" :class="['rounded-xl bg-surface ring-1', tab === 'waiting' ? 'ring-marigold' : 'ring-line']">
        <DashboardInboxVisit :visit="v" :decide="(status, note) => decideVisit(v, status, note)" />
      </div>
      <div v-if="!shown.length" class="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-10 text-center ring-1 ring-line">
        <CalendarDays class="size-6 text-ink-muted" aria-hidden="true" />
        <p class="m-0 max-w-[32em] text-sm leading-[21px] text-ink-muted">
          <template v-if="query">No visits match.</template>
          <template v-else-if="tab === 'waiting'">No requests waiting. Requests from buyers appear here and in your inbox.</template>
          <template v-else>No confirmed visits ahead.{{ waiting.length ? ' Confirm a request and it moves here.' : '' }}</template>
        </p>
      </div>
    </template>

    <!-- Earlier: a table; a row opens the visit -->
    <template v-else>
      <ListTable v-if="shown.length" :rows="shown" :columns="columns" :row-key="visitKey" min-width="640px" @open="v => (opened = v)">
        <template #cell-when="{ row }"><span class="font-mono text-[12.5px] whitespace-nowrap">{{ visitDay(row.day).label }} · {{ row.slot }}</span></template>
        <template #cell-buyerName="{ row }"><strong class="font-semibold">{{ row.buyerName }}</strong></template>
        <template #cell-dogs="{ row }"><span class="text-ink-muted">{{ row.dogFileNos.length ? visitDogNames(row.dogFileNos) : 'The kennel' }}</span></template>
        <template #cell-state="{ row }"><span :class="['rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap', visitStatusLabels[row.status as Visit['status']].tone]">{{ visitStatusLabels[row.status as Visit['status']].label }}</span></template>
      </ListTable>
      <p v-else class="m-0 rounded-xl bg-surface px-5 py-8 text-center text-sm text-ink-muted ring-1 ring-line">{{ query ? 'No visits match.' : 'No earlier visits yet.' }}</p>
    </template>

    <DetailDialog :open="!!opened" :title="opened ? `${opened.service} · ${opened.buyerName}` : ''" :subtitle="opened ? `${visitDay(opened.day).label} at ${opened.slot}` : ''" :sections="[]" @update:open="o => !o && (opened = undefined)">
      <VisitCard v-if="opened" :visit="opened" side="store" muted />
    </DetailDialog>
  </div>
</template>
