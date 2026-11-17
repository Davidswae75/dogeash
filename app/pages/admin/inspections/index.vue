<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, navigateTo, useSeoMeta } from '#imports' // nuxt
import type { DataColumn } from '~/components/list/ListTable.vue'
import { useAdminInspections } from '~/composables/useAdminInspections'
import { useStaff } from '~/composables/useStaff'
import { inspectionStatusMeta, inspectionWhen } from '~/utils/inspections'

// Admin › Inspections: kennel visits booked and done. Admins see all of them; inspectors see their own.
// Each opens the inspection sheet. Book new ones from Applications.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Inspections · Dogeash admin', robots: 'noindex' })

const { list, loaded, load } = useAdminInspections()
const { role } = useStaff()
onMounted(load)

const tab = ref<'upcoming' | 'done'>('upcoming')
const upcoming = computed(() => list.value.filter(i => i.status === 'scheduled').sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for)))
const done = computed(() => list.value.filter(i => i.status !== 'scheduled'))
const tabs = computed(() => [
  { value: 'upcoming' as const, label: 'Booked', count: upcoming.value.length },
  { value: 'done' as const, label: 'Done', count: done.value.length },
])
const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return (tab.value === 'upcoming' ? upcoming.value : done.value).filter(i => !q || `${i.store_name} ${i.store_id} ${i.store_city} ${i.inspector ?? ''}`.toLowerCase().includes(q))
})
type Row = (typeof list.value)[number]
const columns: DataColumn[] = [
  { key: 'when', label: 'When', mobile: 'meta' },
  { key: 'store', label: 'Store', mobile: 'title' },
  { key: 'inspector', label: 'Inspector', mobile: 'row' },
  { key: 'state', label: 'Status', mobile: 'end' },
]
const rowKey = (i: Row) => i.id
const rowLabel = (i: Row) => `${i.store_name}, ${inspectionWhen(i.scheduled_for)}`
const openSheet = (i: Row) => navigateTo(`/admin/inspections/${i.id}`)
</script>

<template>
  <AdminPage title="Inspections" :count="upcoming.length" :description="role === 'admin' ? 'Kennel visits booked and done. Book one from Applications; passing it puts the store live.' : 'The kennel visits you\'re booked for. Open one to work through the sheet on the day.'">
    <div class="flex flex-col gap-4">
      <ListToolbar v-model:search="query" placeholder="Store, city or inspector" :count="shown.length" :noun="['inspection', 'inspections']" :filtered="!!query.trim()" @clear="query = ''">
        <template #tabs><ListTabs v-model="tab" :tabs="tabs" label="Show inspections" /></template>
      </ListToolbar>
      <ListSkeleton v-if="!loaded" variant="table" :rows="5" />
      <p v-else-if="!shown.length" class="m-0 rounded-xl bg-surface px-5 py-8 text-center text-sm text-ink-muted ring-1 ring-line">{{ query ? 'No inspections match.' : tab === 'upcoming' ? 'No inspections booked.' : 'No inspections done yet.' }}</p>
      <!-- A row opens the inspection sheet -->
      <ListTable v-else :rows="shown" :columns="columns" :row-key="rowKey" :row-label="rowLabel" min-width="680px" @open="openSheet">
        <template #cell-when="{ row }"><span class="font-mono text-[12.5px] font-semibold whitespace-nowrap">{{ inspectionWhen(row.scheduled_for) }}</span></template>
        <template #cell-store="{ row }">
          <span class="flex flex-col leading-tight">
            <strong class="font-semibold">{{ row.store_name }}</strong>
            <span class="font-mono text-[11px] font-normal text-ink-muted">{{ row.store_id }} · {{ row.store_city }} · {{ row.dogs }} {{ row.dogs === 1 ? 'dog' : 'dogs' }} · {{ row.checked }} checks marked</span>
          </span>
        </template>
        <template #cell-inspector="{ row }"><span class="text-ink-muted">{{ row.inspector ?? 'No inspector' }}</span></template>
        <template #cell-state="{ row }">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-surface-sunk px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
            <span class="size-2 rounded-full" :style="{ background: inspectionStatusMeta[row.status as Row['status']].color }" aria-hidden="true" />{{ inspectionStatusMeta[row.status as Row['status']].label }}
          </span>
        </template>
      </ListTable>
    </div>
  </AdminPage>
</template>
