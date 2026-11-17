<script setup lang="ts">
import { Dog as DogIcon, MoreHorizontal } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useCookie, useRuntimeConfig, useSeoMeta } from '#imports' // nuxt
import type { DataColumn } from '~/components/list/ListTable.vue'
import type { AdminDog, DogStatus } from '~/utils/admin'
import type { DetailSection } from '~/components/DetailDialog.vue'
import type { CsvColumn } from '~/utils/csv'
import { useAdminListings } from '~/composables/useAdminListings'
import { useNotify } from '~/composables/useNotify'
import { adminTime, dogActions, dogStatusMeta } from '~/utils/admin'
import { dogPhotoUrl, formatNaira } from '~/utils/dogs'

// Admin › Listings: every dog in any status. Take one down (the store reads why), put it back, or approve
// one waiting for review. Drafts and sold dogs are the store's own business, so they have no actions.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Listings · Dogeash admin', robots: 'noindex' })

const { dogs, loaded, load, setStatus } = useAdminListings()
const storageUrl = useRuntimeConfig().public.supabase.url as string
onMounted(load)

const filter = ref<DogStatus | 'all'>('all')
const query = ref('')
const statuses = Object.keys(dogStatusMeta) as DogStatus[]
const countOf = (s: DogStatus) => dogs.value.filter(d => d.status === s).length
const csv: CsvColumn<AdminDog>[] = [
  { label: 'File number', value: d => d.file_no }, { label: 'Name', value: d => d.name }, { label: 'Breed', value: d => d.breed },
  { label: 'Level', value: d => d.level }, { label: 'City', value: d => d.city }, { label: 'Price (NGN)', value: d => d.price_naira },
  { label: 'Status', value: d => dogStatusMeta[d.status].label }, { label: 'Store ID', value: d => d.store_id }, { label: 'Store', value: d => d.store_name },
  { label: 'Created', value: d => d.created_at }, { label: 'Updated', value: d => d.updated_at }, { label: 'Dogeash note', value: d => d.admin_note },
]
const tabs = computed(() => [{ value: 'all' as const, label: 'All', count: dogs.value.length }, ...statuses.map(s => ({ value: s, label: dogStatusMeta[s].label, count: countOf(s), urgent: s === 'pending_review' }))])
const view = useCookie<'grid' | 'table'>('dogeash-admin-listings-view', { default: () => 'table', maxAge: 60 * 60 * 24 * 365 })
const columns: DataColumn[] = [
  { key: 'name', label: 'Dog', mobile: 'title' },
  { key: 'store_name', label: 'Store', mobile: 'meta' },
  { key: 'city', label: 'City', mobile: 'row' },
  { key: 'status', label: 'Status', mobile: 'row' },
  { key: 'updated_at', label: 'Changed', mobile: 'row' },
  { key: 'price_naira', label: 'Price', align: 'right', mono: true, mobile: 'end' },
]
const dogKey = (d: AdminDog) => d.id
const dogLabel = (d: AdminDog) => `${d.name}, ${d.store_name}`
function clearFilters() {
  filter.value = 'all'
  query.value = ''
}
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return dogs.value
    .filter(d => filter.value === 'all' || d.status === filter.value)
    .filter(d => !q || `${d.name} ${d.file_no} ${d.breed} ${d.store_name} ${d.city}`.toLowerCase().includes(q))
})

const pending = ref<{ dog: AdminDog, to: DogStatus, label: string, reason: boolean, effect: string }>()
const confirmOpen = ref(false)
function ask(dog: AdminDog, action: { to: DogStatus, label: string, reason: boolean, effect: string }) {
  pending.value = { dog, ...action }
  confirmOpen.value = true
}
// Everything about one listing
const viewing = ref<AdminDog>()
const viewOpen = ref(false)
function openDog(d: AdminDog) {
  viewing.value = d
  viewOpen.value = true
}
const isLive = (d: AdminDog) => d.status === 'available' || d.status === 'reserved'
const dogSections = computed<DetailSection[]>(() => {
  const d = viewing.value
  if (!d) return []
  return [
    { title: 'Listing', rows: [
      { label: 'File number', value: d.file_no, mono: true, ...(isLive(d) ? { to: `/dogs/${d.file_no.toLowerCase()}`, external: true } : {}) },
      { label: 'Status', value: dogStatusMeta[d.status].label },
      { label: 'Breed', value: d.breed },
      { label: 'Protection level', value: `Level ${d.level}` },
      { label: 'City', value: d.city },
      { label: 'Price', value: formatNaira(d.price_naira), mono: true },
      { label: 'Listed', value: adminTime(d.created_at) },
      { label: 'Last change', value: adminTime(d.updated_at) },
    ] },
    { title: 'Store', rows: [
      { label: 'Store', value: d.store_name, to: `/admin/stores/${d.store_id}` },
      { label: 'Store ID', value: d.store_id, mono: true },
      { label: 'Store status', value: d.store_status.replace('_', ' ') },
    ] },
    { title: 'Dogeash', rows: [{ label: 'Note to the store', value: d.admin_note, long: true }] },
  ]
})
function askFromDialog(a: { to: DogStatus, label: string, reason: boolean, effect: string }) {
  viewOpen.value = false
  ask(viewing.value!, a)
}

async function run(note: string) {
  const p = pending.value!
  const error = await setStatus(p.dog, p.to, note)
  if (!error) useNotify().adminDone(`${p.dog.name}: ${dogStatusMeta[p.to].label.toLowerCase()}`, 'The store\'s owners and managers have been told. It\'s in the audit log.')
  return error
}
</script>

<template>
  <AdminPage title="Listings" :count="dogs.length" description="Every dog on Dogeash in any status. Taking one down hides it at once and tells the store why.">
    <template #actions>
      <AdminExport name="listings" :rows="shown" :columns="csv" />
    </template>

    <div class="flex flex-col gap-4">
      <ListToolbar v-model:search="query" placeholder="Name, file number, breed, store" :count="shown.length" :noun="['listing', 'listings']" :filtered="filter !== 'all' || !!query.trim()" @clear="clearFilters">
        <template #tabs><ListTabs v-model="filter" :tabs="tabs" label="Show listings" /></template>
        <template #end><ListViewSwitch v-model="view" /></template>
      </ListToolbar>

      <ListSkeleton v-if="!loaded" variant="table" :rows="5" />
      <p v-else-if="!shown.length" class="m-0 rounded-xl bg-surface px-5 py-8 text-center text-sm text-ink-muted ring-1 ring-line">{{ dogs.length ? 'No listings match.' : 'No dogs yet.' }}</p>

      <!-- Table: a row shows the essentials; clicking it opens everything about the listing -->
      <ListTable v-else-if="view === 'table'" :rows="shown" :columns="columns" :row-key="dogKey" :row-label="dogLabel" @open="openDog">
        <template #cell-name="{ row }">
          <span class="flex items-center gap-3">
            <img v-if="row.photo_path" :src="dogPhotoUrl(row.photo_path, storageUrl)" alt="" class="size-10 shrink-0 rounded-lg object-cover">
            <span v-else class="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-sunk text-ink-muted"><DogIcon class="size-4" aria-hidden="true" /></span>
            <span class="flex min-w-0 flex-col leading-tight">
              <strong class="font-semibold">{{ row.name }}</strong>
              <span class="font-mono text-[11px] text-ink-muted">{{ row.file_no }} · {{ row.breed }}</span>
            </span>
          </span>
        </template>
        <template #cell-status="{ row }">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-surface-sunk px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
            <span class="size-2 rounded-full" :style="{ background: dogStatusMeta[row.status as DogStatus].color }" aria-hidden="true" />{{ dogStatusMeta[row.status as DogStatus].label }}
          </span>
        </template>
        <template #cell-updated_at="{ row }"><span class="text-xs text-ink-muted">{{ adminTime(row.updated_at) }}</span></template>
        <template #cell-price_naira="{ row }"><strong class="font-semibold">{{ formatNaira(row.price_naira) }}</strong></template>
        <template #actions="{ row }">
          <DropdownMenu v-if="dogActions[row.status as DogStatus].length">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="size-8" :aria-label="`Actions for ${row.name}`"><MoreHorizontal aria-hidden="true" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-52 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
              <DropdownMenuItem v-for="a in dogActions[row.status as DogStatus]" :key="a.to" @select="ask(row, a)">
                <span class="size-2 rounded-full" :style="{ background: dogStatusMeta[a.to].color }" aria-hidden="true" />{{ a.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>
      </ListTable>

      <!-- Grid: the photos, for checking what buyers see -->
      <ul v-else class="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3 xl:grid-cols-4">
        <li v-for="d in shown" :key="d.id">
          <button type="button" class="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border-0 bg-surface p-0 text-left text-ink ring-1 ring-line hover:ring-ink" @click="openDog(d)">
            <span class="relative block aspect-[4/3] bg-surface-sunk">
              <img v-if="d.photo_path" :src="dogPhotoUrl(d.photo_path, storageUrl)" alt="" class="size-full object-cover">
              <span v-else class="grid size-full place-items-center text-ink-muted"><DogIcon class="size-7" aria-hidden="true" /></span>
              <span class="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-semibold backdrop-blur"><span class="size-2 rounded-full" :style="{ background: dogStatusMeta[d.status].color }" aria-hidden="true" />{{ dogStatusMeta[d.status].label }}</span>
            </span>
            <span class="flex flex-1 flex-col gap-1 p-3">
              <strong class="truncate text-[15px] font-semibold">{{ d.name }}</strong>
              <span class="truncate text-xs text-ink-muted">{{ d.store_name }} · {{ d.city }}</span>
              <span class="mt-auto pt-1 font-mono text-[13px] font-semibold tabular-nums">{{ formatNaira(d.price_naira) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>

    <DetailDialog v-if="viewing" v-model:open="viewOpen" :title="viewing.name" :subtitle="`${viewing.breed} · ${viewing.store_name}`" :sections="dogSections">
      <template #top>
        <img v-if="viewing.photo_path" :src="dogPhotoUrl(viewing.photo_path, storageUrl)" alt="" class="aspect-[16/9] w-full rounded-lg object-cover">
      </template>
      <template #actions>
        <Button v-if="isLive(viewing)" as-child variant="ghost"><NuxtLink :to="`/dogs/${viewing.file_no.toLowerCase()}`" target="_blank">Public page</NuxtLink></Button>
        <!-- Putting a dog live is the main action (marigold); taking one down is red; sending back is plain -->
        <Button v-for="a in dogActions[viewing.status]" :key="a.to" :variant="a.to === 'available' ? 'marigold' : 'outline'" :class="a.to === 'withdrawn' && 'border-danger/50 text-danger hover:bg-danger/10 hover:text-danger'" @click="askFromDialog(a)">
          <span class="size-2 rounded-full" :style="{ background: dogStatusMeta[a.to].color }" aria-hidden="true" />{{ a.label }}
        </Button>
      </template>
    </DetailDialog>

    <AdminConfirm
      v-if="pending"
      v-model:open="confirmOpen"
      :title="`${pending.label}: ${pending.dog.name}`"
      :description="`${dogStatusMeta[pending.dog.status].label} → ${dogStatusMeta[pending.to].label}. ${pending.effect}`"
      :confirm-label="pending.label"
      :reason-required="pending.reason"
      reason-for="the store"
      :danger="pending.to === 'withdrawn' || pending.to === 'draft'"
      :run="run"
    />
  </AdminPage>
</template>
