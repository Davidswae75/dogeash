<script setup lang="ts">
import { ExternalLink, MoreHorizontal } from '@lucide/vue'
import { computed, ref } from 'vue'
import { navigateTo } from '#imports' // nuxt
import type { DataColumn } from '~/components/list/ListTable.vue'
import type { AdminStore, StoreStatus } from '~/utils/admin'
import type { CsvColumn } from '~/utils/csv'
import { useAdmin } from '~/composables/useAdmin'
import { useNotify } from '~/composables/useNotify'
import { initialsOf } from '~/utils/account'
import { adminTime, storeActionEffect, storeActions, storeStatusMeta } from '~/utils/admin'

// Every store with its status, and the actions that move it on (approve, decline, suspend, restore …).
// Each action is confirmed in a dialog that says what will happen; declining and suspending need a reason,
// which the store reads in its bell and on its dashboard. Changes are logged in the audit log.
const { stores, storesLoaded, setStoreStatus } = useAdmin()

const filter = ref<StoreStatus | 'all'>('all')
const query = ref('')
const statuses = Object.keys(storeStatusMeta) as StoreStatus[]
const countOf = (s: StoreStatus) => stores.value.filter(x => x.status === s).length
// For the CSV export: the stores on screen
const csv: CsvColumn<AdminStore>[] = [
  { label: 'Store ID', value: s => s.public_id }, { label: 'Name', value: s => s.name }, { label: 'City', value: s => s.city },
  { label: 'Status', value: s => storeStatusMeta[s.status].label }, { label: 'Owner', value: s => s.owner }, { label: 'Dogs', value: s => s.dogs },
  { label: 'Live dogs', value: s => s.live_dogs }, { label: 'Rating', value: s => s.rating }, { label: 'Reviews', value: s => s.reviews_count },
  { label: 'Opened', value: s => s.created_at }, { label: 'Last change', value: s => s.status_changed_at }, { label: 'Dogeash note', value: s => s.status_note },
]
const tabs = computed(() => [{ value: 'all' as const, label: 'All', count: stores.value.length }, ...statuses.map(st => ({ value: st, label: storeStatusMeta[st].label, count: countOf(st), urgent: st === 'in_review' }))])
function clearFilters() {
  filter.value = 'all'
  query.value = ''
}
const columns: DataColumn[] = [
  { key: 'store', label: 'Store', mobile: 'title' },
  { key: 'owner', label: 'Owner', mobile: 'meta' },
  { key: 'state', label: 'Status', mobile: 'end' },
  { key: 'dogs', label: 'Live dogs', align: 'right', mono: true, mobile: 'row' },
  { key: 'change', label: 'Last change', mobile: 'row' },
]
const storeKey = (st: AdminStore) => st.public_id
const storeLabel = (st: AdminStore) => `${st.name}, ${storeStatusMeta[st.status].label}`
const openStore = (st: AdminStore) => navigateTo(`/admin/stores/${st.public_id}`)
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return stores.value
    .filter(s => filter.value === 'all' || s.status === filter.value)
    .filter(s => !q || `${s.name} ${s.public_id} ${s.city} ${s.owner ?? ''}`.toLowerCase().includes(q))
})

// The action being confirmed
const pending = ref<{ store: AdminStore, to: StoreStatus, label: string, reason: boolean }>()
const confirmOpen = ref(false)
function ask(store: AdminStore, action: { to: StoreStatus, label: string, reason: boolean }) {
  pending.value = { store, ...action }
  confirmOpen.value = true
}
async function run(note: string) {
  const p = pending.value!
  const error = await setStoreStatus(p.store, p.to, note)
  if (!error) useNotify().adminDone(`${p.store.name}: ${storeStatusMeta[p.to].label.toLowerCase()}`, 'The store\'s owners and managers have been told. It\'s in the audit log.')
  return error
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <ListToolbar v-model:search="query" placeholder="Name, ID, city or owner" :count="shown.length" :noun="['store', 'stores']" :filtered="filter !== 'all' || !!query.trim()" @clear="clearFilters">
      <template #tabs><ListTabs v-model="filter" :tabs="tabs" label="Show stores" /></template>
      <template #end><AdminExport name="stores" :rows="shown" :columns="csv" /></template>
    </ListToolbar>

    <ListSkeleton v-if="!storesLoaded" variant="table" :rows="5" label="Loading stores" />
    <p v-else-if="!shown.length" class="m-0 rounded-xl bg-surface px-5 py-8 text-center text-sm text-ink-muted ring-1 ring-line">{{ stores.length ? 'No stores match.' : 'No stores yet.' }}</p>
    <!-- A row opens the store's page in admin; the ⋯ menu changes its status -->
    <ListTable v-else :rows="shown" :columns="columns" :row-key="storeKey" :row-label="storeLabel" min-width="800px" @open="openStore">
      <template #cell-store="{ row }">
        <span class="flex items-center gap-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-night text-[11px] font-bold text-on-night">{{ initialsOf(row.name) }}</span>
          <span class="flex min-w-0 flex-col leading-tight">
            <span class="flex items-center gap-1.5 font-semibold">
              {{ row.name }}
              <NuxtLink v-if="row.status === 'verified'" :to="`/stores/${row.slug}`" target="_blank" class="text-ink-muted hover:text-ink" :aria-label="`Open ${row.name}'s public page`" @click.stop><ExternalLink class="size-3" aria-hidden="true" /></NuxtLink>
            </span>
            <span class="font-mono text-[11px] font-normal text-ink-muted">{{ row.public_id }} · {{ row.city }}</span>
          </span>
        </span>
      </template>
      <template #cell-owner="{ row }"><span class="text-ink-muted">{{ row.owner || '—' }}</span></template>
      <template #cell-state="{ row }">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-surface-sunk px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
          <span class="size-2 rounded-full" :style="{ background: storeStatusMeta[row.status as StoreStatus].color }" aria-hidden="true" />{{ storeStatusMeta[row.status as StoreStatus].label }}
        </span>
      </template>
      <template #cell-dogs="{ row }">{{ row.live_dogs }}<span class="text-ink-muted"> / {{ row.dogs }}</span></template>
      <template #cell-change="{ row }">
        <span v-if="row.status_changed_at" class="flex max-w-[260px] flex-col leading-snug">
          <span class="font-mono text-[11px] text-ink-muted">{{ adminTime(row.status_changed_at) }}</span>
          <span v-if="row.status_note" class="line-clamp-2 text-[12.5px]" :title="row.status_note">{{ row.status_note }}</span>
        </span>
        <span v-else class="text-[12px] text-ink-muted">Opened {{ adminTime(row.created_at) }}</span>
      </template>
      <template #actions="{ row }">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="size-8" :aria-label="`Change ${row.name}'s status`"><MoreHorizontal aria-hidden="true" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-52 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
            <DropdownMenuLabel class="text-xs text-ink-muted">Move {{ row.name }} to…</DropdownMenuLabel>
            <DropdownMenuItem v-for="a in storeActions[row.status as StoreStatus]" :key="a.to" :class="a.tone === 'stop' && 'text-danger'" @select="ask(row, a)">
              <span class="size-2 rounded-full" :style="{ background: storeStatusMeta[a.to].color }" aria-hidden="true" />{{ a.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </ListTable>

    <AdminConfirm
      v-if="pending"
      v-model:open="confirmOpen"
      :title="`${pending.label}: ${pending.store.name}`"
      :description="`${storeStatusMeta[pending.store.status].label} → ${storeStatusMeta[pending.to].label}. ${storeActionEffect[pending.to]}`"
      :confirm-label="pending.label"
      :reason-required="pending.reason"
      reason-for="the store"
      :danger="pending.to !== 'verified'"
      :run="run"
    />
  </div>
</template>
