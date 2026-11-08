<script setup lang="ts">
import { ExternalLink, MoreHorizontal, Search } from '@lucide/vue'
import { computed, ref } from 'vue'
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
const filterModel = computed({ get: () => filter.value, set: (v: string) => { if (v) filter.value = v as StoreStatus | 'all' } })
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
  <AdminCard title="Stores" description="Change a store's status. Its owners and managers are told, and every change is logged." flush>
    <template #actions>
      <AdminExport name="stores" :rows="shown" :columns="csv" />
      <label class="relative hidden sm:block">
        <span class="sr-only">Search stores</span>
        <Search class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <Input v-model="query" type="search" placeholder="Search" class="h-8 w-44 pl-8 text-xs" />
      </label>
    </template>

    <div class="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
      <ToggleGroup v-model="filterModel" type="single" variant="outline" size="sm" aria-label="Show stores" class="flex-wrap justify-start">
        <ToggleGroupItem value="all" class="px-2.5 text-xs">All <span class="ml-1 font-mono text-ink-muted">{{ stores.length }}</span></ToggleGroupItem>
        <ToggleGroupItem v-for="s in statuses" :key="s" :value="s" class="px-2.5 text-xs">
          <span class="mr-1 size-2 rounded-full" :style="{ background: storeStatusMeta[s].color }" aria-hidden="true" />{{ storeStatusMeta[s].label }} <span class="ml-1 font-mono text-ink-muted">{{ countOf(s) }}</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div class="relative overflow-x-auto">
      <table v-if="shown.length" class="w-full min-w-[760px] border-collapse text-left text-[13px]">
        <thead>
          <tr class="text-[11.5px] text-ink-muted">
            <th scope="col" class="border-t border-line px-5 py-2 font-medium">Store</th>
            <th scope="col" class="border-t border-line px-3 py-2 font-medium">Owner</th>
            <th scope="col" class="border-t border-line px-3 py-2 font-medium">Status</th>
            <th scope="col" class="border-t border-line px-3 py-2 text-right font-medium">Live dogs</th>
            <th scope="col" class="border-t border-line px-3 py-2 font-medium">Last change</th>
            <th scope="col" class="w-12 border-t border-line"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in shown" :key="s.public_id" class="align-top hover:bg-surface-sunk/60">
            <td class="border-t border-line px-5 py-2.5">
              <span class="flex items-center gap-3">
                <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-night text-[11px] font-bold text-on-night">{{ initialsOf(s.name) }}</span>
                <span class="flex min-w-0 flex-col leading-tight">
                  <span class="flex items-center gap-1.5 font-medium">
                    <NuxtLink :to="`/admin/stores/${s.public_id}`" class="text-ink hover:underline">{{ s.name }}</NuxtLink>
                    <NuxtLink v-if="s.status === 'verified'" :to="`/stores/${s.slug}`" target="_blank" class="text-ink-muted hover:text-ink" :aria-label="`Open ${s.name}'s public page`"><ExternalLink class="size-3" aria-hidden="true" /></NuxtLink>
                  </span>
                  <span class="font-mono text-[11px] text-ink-muted">{{ s.public_id }} · {{ s.city }}</span>
                </span>
              </span>
            </td>
            <td class="border-t border-line px-3 py-2.5 text-ink-muted">{{ s.owner || '—' }}</td>
            <td class="border-t border-line px-3 py-2.5">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-surface-sunk px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                <span class="size-2 rounded-full" :style="{ background: storeStatusMeta[s.status].color }" aria-hidden="true" />{{ storeStatusMeta[s.status].label }}
              </span>
            </td>
            <td class="border-t border-line px-3 py-2.5 text-right font-mono tabular-nums">{{ s.live_dogs }}<span class="text-ink-muted"> / {{ s.dogs }}</span></td>
            <td class="max-w-[260px] border-t border-line px-3 py-2.5">
              <span v-if="s.status_changed_at" class="flex flex-col leading-snug">
                <span class="font-mono text-[11px] text-ink-muted">{{ adminTime(s.status_changed_at) }}</span>
                <span v-if="s.status_note" class="line-clamp-2 text-[12.5px]" :title="s.status_note">{{ s.status_note }}</span>
              </span>
              <span v-else class="text-[12px] text-ink-muted">Opened {{ adminTime(s.created_at) }}</span>
            </td>
            <td class="border-t border-line pr-3 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="mt-1 size-8" :aria-label="`Change ${s.name}'s status`"><MoreHorizontal aria-hidden="true" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-52 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
                  <DropdownMenuLabel class="text-xs text-ink-muted">Move {{ s.name }} to…</DropdownMenuLabel>
                  <DropdownMenuItem v-for="a in storeActions[s.status]" :key="a.to" :class="a.tone === 'stop' && 'text-danger'" @select="ask(s, a)">
                    <span class="size-2 rounded-full" :style="{ background: storeStatusMeta[a.to].color }" aria-hidden="true" />{{ a.label }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
      <ListSkeleton v-else-if="!storesLoaded" variant="table" :rows="5" label="Loading stores" />
      <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">{{ stores.length ? 'No stores match.' : 'No stores yet.' }}</p>
    </div>

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
  </AdminCard>
</template>
