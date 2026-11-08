<script setup lang="ts">
import { BellRing } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { AdminVisit } from '~/composables/useAdminVisits'
import type { DetailSection } from '~/components/DetailDialog.vue'
import type { CsvColumn } from '~/utils/csv'
import { useAdminVisits } from '~/composables/useAdminVisits'
import { useNotify } from '~/composables/useNotify'
import { adminTime } from '~/utils/admin'
import { shortTime, visitDay } from '~/utils/time'

// Admin › Visits: kennel visit requests across all stores. Chase the ones stores haven't answered in two days
// (nudge sends the store a reminder), see the ones that were missed, and which stores are slow to answer.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Visits · Dogeash admin', robots: 'noindex' })

const { visits, stores, loaded, load, nudge } = useAdminVisits()
onMounted(load)

type Tab = 'chase' | 'missed' | 'upcoming' | 'all'
const tab = ref<Tab>('chase')
const tabModel = computed({ get: () => tab.value, set: (v: string) => { if (v) tab.value = v as Tab } })
const today = new Date().toISOString().slice(0, 10)
const groups = computed<Record<Tab, AdminVisit[]>>(() => ({
  chase: visits.value.filter(v => v.needs_chasing),
  missed: visits.value.filter(v => v.missed),
  upcoming: visits.value.filter(v => v.day >= today && (v.status === 'requested' || v.status === 'confirmed')).sort((a, b) => `${a.day}${a.slot}`.localeCompare(`${b.day}${b.slot}`)),
  all: visits.value,
}))
const tabs: { value: Tab, label: string }[] = [
  { value: 'chase', label: 'Needs chasing' },
  { value: 'missed', label: 'Missed' },
  { value: 'upcoming', label: 'Coming up' },
  { value: 'all', label: 'All (60 days)' },
]
const nudged = ref<Set<string>>(new Set())
async function onNudge(v: AdminVisit) {
  const error = await nudge(v)
  if (error) return useNotify().failed(error)
  nudged.value = new Set([...nudged.value, v.id])
  useNotify().adminDone(`${v.store_name} reminded`, `About ${v.buyer_name || 'a buyer'}'s visit on ${visitDay(v.day).label}. It's in the audit log.`)
}
// Everything about one visit
const viewing = ref<AdminVisit>()
const viewOpen = ref(false)
function openVisit(v: AdminVisit) {
  viewing.value = v
  viewOpen.value = true
}
const visitSections = computed<DetailSection[]>(() => {
  const v = viewing.value
  if (!v) return []
  return [
    { title: 'Visit', rows: [
      { label: 'When', value: `${visitDay(v.day).label} at ${v.slot}`, mono: true },
      { label: 'Where', value: v.place === 'home' ? 'At the buyer\'s home' : 'At the kennel' },
      { label: 'Service', value: v.service },
      { label: 'Status', value: v.missed ? 'missed (never answered)' : v.needs_chasing ? `${v.status}, waiting 2+ days` : v.status },
      { label: 'Asked', value: adminTime(v.created_at) },
      { label: 'Last change', value: adminTime(v.updated_at) },
      { label: 'Store\'s note', value: v.store_note, long: true },
    ] },
    { title: 'People', rows: [
      { label: 'Store', value: v.store_name, to: `/admin/stores/${v.store_id}` },
      { label: 'Buyer', value: v.buyer_name || 'A buyer', to: `/admin/people/${v.buyer_id}` },
      { label: 'Buyer\'s email', value: v.buyer_email, mono: true },
    ] },
  ]
})

const slow = computed(() => stores.value.filter(s => s.missed > 0 || (s.median_hours ?? 0) > 24))
const csv: CsvColumn<AdminVisit>[] = [
  { label: 'Day', value: v => v.day }, { label: 'Time', value: v => v.slot }, { label: 'Status', value: v => v.missed ? 'missed' : v.status },
  { label: 'Store ID', value: v => v.store_id }, { label: 'Store', value: v => v.store_name }, { label: 'Buyer', value: v => v.buyer_name },
  { label: 'Buyer email', value: v => v.buyer_email }, { label: 'Where', value: v => v.place }, { label: 'Asked', value: v => v.created_at },
]
</script>

<template>
  <AdminPage title="Visits" :count="groups.chase.length" description="Kennel visit requests across every store. Buyers who wait days for an answer go elsewhere: chase stores that are slow.">
    <template #actions>
      <AdminExport name="visits" :rows="groups[tab]" :columns="csv" />
      <ToggleGroup v-model="tabModel" type="single" variant="outline" size="sm" aria-label="Show visits" class="flex-wrap">
        <ToggleGroupItem v-for="t in tabs" :key="t.value" :value="t.value" class="px-2.5 text-xs">{{ t.label }} <span class="ml-1 font-mono text-ink-muted">{{ groups[t.value].length }}</span></ToggleGroupItem>
      </ToggleGroup>
    </template>

    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <AdminCard flush>
        <div class="relative overflow-x-auto">
          <table v-if="groups[tab].length" class="w-full min-w-[520px] border-collapse text-left text-[13px]">
            <thead>
              <tr class="text-[11.5px] text-ink-muted">
                <th scope="col" class="px-5 py-2.5 font-medium">When</th>
                <th scope="col" class="px-3 py-2.5 font-medium">Store</th>
                <th scope="col" class="px-3 py-2.5 font-medium">Status</th>
                <th scope="col" class="w-24"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <!-- A row shows the essentials; clicking it opens everything about the visit -->
              <tr v-for="v in groups[tab]" :key="v.id" class="cursor-pointer align-top hover:bg-surface-sunk/60" @click="openVisit(v)">
                <td class="border-t border-line px-5 py-2.5 font-mono text-[12px] whitespace-nowrap">
                  <button type="button" class="cursor-pointer border-0 bg-transparent p-0 text-left font-mono text-[12px] text-ink" @click.stop="openVisit(v)">{{ visitDay(v.day).label }} · {{ v.slot }}</button>
                </td>
                <td class="border-t border-line px-3 py-2.5">{{ v.store_name }}</td>
                <td class="border-t border-line px-3 py-2.5">
                  <span :class="['text-xs font-semibold', v.missed ? 'text-danger' : v.needs_chasing ? 'text-ink' : 'text-ink-muted']">{{ v.missed ? 'missed' : v.needs_chasing ? 'waiting 2+ days' : v.status }}</span>
                </td>
                <td class="border-t border-line pr-4 text-right">
                  <Button v-if="v.status === 'requested' && !v.missed" variant="outline" size="sm" class="mt-1 h-8" :disabled="nudged.has(v.id)" @click.stop="onNudge(v)">
                    <BellRing aria-hidden="true" />{{ nudged.has(v.id) ? 'Nudged' : 'Nudge' }}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
          <ListSkeleton v-else-if="!loaded" variant="table" :rows="5" />
          <p v-else class="m-0 px-5 py-4 text-[13px] text-ink-muted">{{ tab === 'chase' ? 'Nothing waiting more than two days. Stores are answering.' : 'Nothing here.' }}</p>
        </div>
      </AdminCard>

      <AdminCard title="How stores answer" description="Last 90 days · median time from request to the store's decision" flush>
        <table v-if="stores.length" class="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="px-5 py-2 font-medium">Store</th>
              <th scope="col" class="px-2 py-2 text-right font-medium">Asked</th>
              <th scope="col" class="px-2 py-2 text-right font-medium">Median</th>
              <th scope="col" class="px-5 py-2 text-right font-medium">Missed</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in stores" :key="s.store_id" :class="slow.includes(s) && 'bg-danger/5'">
              <td class="border-t border-line px-5 py-2"><NuxtLink :to="`/admin/stores/${s.store_id}`" class="text-ink hover:underline">{{ s.store_name }}</NuxtLink></td>
              <td class="border-t border-line px-2 py-2 text-right font-mono tabular-nums">{{ s.requests }}</td>
              <td class="border-t border-line px-2 py-2 text-right font-mono tabular-nums">{{ s.median_hours === null ? '—' : s.median_hours < 1 ? '<1 h' : `${Math.round(s.median_hours)} h` }}</td>
              <td :class="['border-t border-line px-5 py-2 text-right font-mono tabular-nums', s.missed && 'font-semibold text-danger']">{{ s.missed }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">No visit requests in the last 90 days.</p>
      </AdminCard>
    </div>
    <DetailDialog v-if="viewing" v-model:open="viewOpen" :title="`${viewing.service} · ${viewing.store_name}`" :subtitle="`${visitDay(viewing.day).label} at ${viewing.slot}`" :sections="visitSections">
      <template v-if="viewing.status === 'requested' && !viewing.missed" #actions>
        <Button variant="marigold" :disabled="nudged.has(viewing.id)" @click="onNudge(viewing)"><BellRing aria-hidden="true" />{{ nudged.has(viewing.id) ? 'Nudged' : 'Nudge the store' }}</Button>
      </template>
    </DetailDialog>
  </AdminPage>
</template>
