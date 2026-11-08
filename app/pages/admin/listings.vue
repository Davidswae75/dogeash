<script setup lang="ts">
import { Dog as DogIcon, MoreHorizontal, Search } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useRuntimeConfig, useSeoMeta } from '#imports' // nuxt
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
const filterModel = computed({ get: () => filter.value, set: (v: string) => { if (v) filter.value = v as DogStatus | 'all' } })
const query = ref('')
const statuses = Object.keys(dogStatusMeta) as DogStatus[]
const countOf = (s: DogStatus) => dogs.value.filter(d => d.status === s).length
const csv: CsvColumn<AdminDog>[] = [
  { label: 'File number', value: d => d.file_no }, { label: 'Name', value: d => d.name }, { label: 'Breed', value: d => d.breed },
  { label: 'Level', value: d => d.level }, { label: 'City', value: d => d.city }, { label: 'Price (NGN)', value: d => d.price_naira },
  { label: 'Status', value: d => dogStatusMeta[d.status].label }, { label: 'Store ID', value: d => d.store_id }, { label: 'Store', value: d => d.store_name },
  { label: 'Created', value: d => d.created_at }, { label: 'Updated', value: d => d.updated_at }, { label: 'Dogeash note', value: d => d.admin_note },
]
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
      <label class="relative">
        <span class="sr-only">Search listings</span>
        <Search class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <Input v-model="query" type="search" placeholder="Name, file number, store" class="h-9 w-64 pl-8 text-sm" />
      </label>
    </template>

    <AdminCard flush>
      <div class="flex flex-wrap gap-2 px-5 py-3">
        <ToggleGroup v-model="filterModel" type="single" variant="outline" size="sm" aria-label="Show listings" class="flex-wrap justify-start">
          <ToggleGroupItem value="all" class="px-2.5 text-xs">All <span class="ml-1 font-mono text-ink-muted">{{ dogs.length }}</span></ToggleGroupItem>
          <ToggleGroupItem v-for="s in statuses" :key="s" :value="s" class="px-2.5 text-xs">
            <span class="mr-1 size-2 rounded-full" :style="{ background: dogStatusMeta[s].color }" aria-hidden="true" />{{ dogStatusMeta[s].label }} <span class="ml-1 font-mono text-ink-muted">{{ countOf(s) }}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div class="relative overflow-x-auto">
        <table v-if="shown.length" class="w-full min-w-[560px] border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="border-t border-line px-5 py-2 font-medium">Dog</th>
              <th scope="col" class="border-t border-line px-3 py-2 font-medium">Status</th>
              <th scope="col" class="border-t border-line px-3 py-2 text-right font-medium">Price</th>
              <th scope="col" class="w-12 border-t border-line"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <!-- A row shows the essentials; clicking it opens everything about the listing -->
            <tr v-for="d in shown" :key="d.id" class="cursor-pointer align-top hover:bg-surface-sunk/60" @click="openDog(d)">
              <td class="border-t border-line px-5 py-2.5">
                <span class="flex items-center gap-3">
                  <img v-if="d.photo_path" :src="dogPhotoUrl(d.photo_path, storageUrl)" alt="" class="size-10 shrink-0 rounded-md object-cover">
                  <span v-else class="grid size-10 shrink-0 place-items-center rounded-md bg-surface-sunk text-ink-muted"><DogIcon class="size-4" aria-hidden="true" /></span>
                  <span class="flex min-w-0 flex-col leading-tight">
                    <button type="button" class="w-fit cursor-pointer border-0 bg-transparent p-0 text-left font-medium text-ink hover:underline" @click.stop="openDog(d)">{{ d.name }}</button>
                    <span class="font-mono text-[11px] text-ink-muted">{{ d.file_no }} · {{ d.store_name }}</span>
                  </span>
                </span>
              </td>
              <td class="border-t border-line px-3 py-2.5">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-surface-sunk px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                  <span class="size-2 rounded-full" :style="{ background: dogStatusMeta[d.status].color }" aria-hidden="true" />{{ dogStatusMeta[d.status].label }}
                </span>
              </td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono whitespace-nowrap tabular-nums">{{ formatNaira(d.price_naira) }}</td>
              <td class="border-t border-line pr-3 text-right" @click.stop>
                <DropdownMenu v-if="dogActions[d.status].length">
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="mt-1 size-8" :aria-label="`Actions for ${d.name}`"><MoreHorizontal aria-hidden="true" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-52 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
                    <DropdownMenuItem v-for="a in dogActions[d.status]" :key="a.to" @select="ask(d, a)">
                      <span class="size-2 rounded-full" :style="{ background: dogStatusMeta[a.to].color }" aria-hidden="true" />{{ a.label }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
        <ListSkeleton v-else-if="!loaded" variant="table" :rows="5" />
        <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">{{ dogs.length ? 'No listings match.' : 'No dogs yet.' }}</p>
      </div>
    </AdminCard>

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
