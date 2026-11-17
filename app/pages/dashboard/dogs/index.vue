<script setup lang="ts">
import { Pin, Plus } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useCookie, useSeoMeta } from '#imports' // nuxt
import type { StoreDog } from '~/utils/dogs'
import type { ListingStatus } from '~/utils/k9'
import { useStoreContext } from '~/composables/useStoreContext'
import { useStoreDogs } from '~/composables/useStoreDogs'

// The store's dogs, from draft to sold: filter by where each one is, and move them on from the ⋯ menu
definePageMeta({ layout: 'dashboard', title: 'Dogs', middleware: 'store-member' })
useSeoMeta({ title: 'Dogs · Store dashboard · Dogeash', robots: 'noindex' })

const { role, store } = useStoreContext()
const storeDogs = useStoreDogs()
const { dogs, loaded, verified, pinned } = storeDogs
onMounted(storeDogs.load)

const groups: { value: string, label: string, statuses: ListingStatus[] }[] = [
  { value: 'all', label: 'All', statuses: [] },
  { value: 'live', label: 'Live', statuses: ['available', 'reserved'] },
  { value: 'drafts', label: 'Drafts', statuses: ['draft', 'pending_review'] },
  { value: 'done', label: 'Sold and withdrawn', statuses: ['sold', 'withdrawn'] },
]
const filter = ref('all')
const inGroup = (d: StoreDog, g: typeof groups[number]) => !g.statuses.length || g.statuses.includes(d.status)
const tabs = computed(() => groups.map(g => ({ value: g.value, label: g.label, count: dogs.value.filter(d => inGroup(d, g)).length })))

// Search, order, and table (managing) or grid (photos), remembered on this device
const query = ref('')
type DogSort = 'changed' | 'name' | 'price-low' | 'price-high'
const sort = ref<DogSort>('changed')
const sortOptions = [
  { value: 'changed', label: 'Recently changed' },
  { value: 'name', label: 'Name: A to Z' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
] as const
const view = useCookie<'grid' | 'table'>('dogeash-store-dogs-view', { default: () => 'table', maxAge: 60 * 60 * 24 * 365 })
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = dogs.value.filter(d => inGroup(d, groups.find(g => g.value === filter.value)!)
    && (!q || [d.name, d.breed, d.fileNo].some(t => t.toLowerCase().includes(q))))
  const by: Record<DogSort, (a: StoreDog, b: StoreDog) => number> = {
    'changed': (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    'name': (a, b) => a.name.localeCompare(b.name),
    'price-low': (a, b) => a.priceNaira - b.priceNaira,
    'price-high': (a, b) => b.priceNaira - a.priceNaira,
  }
  return [...list].sort(by[sort.value])
})
function clearFilters() {
  filter.value = 'all'
  query.value = ''
}

const deleting = ref<StoreDog>()
const busy = ref(false)
async function confirmDelete() {
  busy.value = true
  await storeDogs.deleteDraft(deleting.value!)
  busy.value = false
  deleting.value = undefined
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <p class="m-0 max-w-[44em] text-[15px] leading-6 text-ink-muted">
        Every dog {{ store.name }} lists. New dogs start as drafts{{ verified ? '; put them live when its details and photo are ready.' : '. They go live once your store passes its inspection.' }}
      </p>
      <Button as-child variant="marigold"><NuxtLink to="/dashboard/dogs/new"><Plus aria-hidden="true" />Add a dog</NuxtLink></Button>
    </header>

    <p v-if="dogs.some(d => d.status === 'available' || d.status === 'reserved')" class="m-0 flex items-start gap-2 text-[13px] leading-5 text-ink-muted">
      <Pin class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>Pin up to 3 live dogs from a dog's ⋯ menu to show them first on your store page. <strong class="font-semibold text-ink">{{ pinned.length }} of 3 pinned.</strong><template v-if="!pinned.length"> Until you pin any, your page shows the first available ones.</template></span>
    </p>

    <ListToolbar v-if="dogs.length" v-model:search="query" placeholder="Name, breed or ID" :count="shown.length" :noun="['dog', 'dogs']" :filtered="filter !== 'all' || !!query.trim()" @clear="clearFilters">
      <template #tabs><ListTabs v-model="filter" :tabs="tabs" label="Show dogs" /></template>
      <template #end>
        <SelectMenu v-model="sort" :options="sortOptions" aria-label="Order" class="h-10! w-[176px] border-line-strong bg-surface" />
        <ListViewSwitch v-model="view" />
      </template>
    </ListToolbar>

    <ListSkeleton v-if="!loaded" variant="table" :rows="4" class="overflow-hidden rounded-xl bg-surface ring-1 ring-line" label="Loading your dogs" />
    <template v-else-if="shown.length">
      <DashboardDogTable v-if="view === 'table'" :dogs="shown" :verified="verified" :can-delete="role !== 'handler'" @status="storeDogs.changeStatus" @remove="d => (deleting = d)" @pin="storeDogs.togglePin" />
      <DashboardDogGrid v-else :dogs="shown" :verified="verified" :can-delete="role !== 'handler'" @status="storeDogs.changeStatus" @remove="d => (deleting = d)" @pin="storeDogs.togglePin" />
    </template>
    <p v-else-if="dogs.length" class="m-0 rounded-xl bg-surface p-8 text-center text-sm text-ink-muted ring-1 ring-line">No dogs here.</p>
    <div v-else-if="loaded" class="flex flex-col items-center gap-4 rounded-xl bg-surface px-6 py-14 text-center ring-1 ring-line">
      <h2 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">No dogs yet</h2>
      <p class="m-0 max-w-[32em] text-[15px] leading-6 text-ink-muted">Add your first dog with its details: health, training, who it suits and a photo. It stays a draft until you put it live.</p>
      <Button as-child variant="marigold"><NuxtLink to="/dashboard/dogs/new"><Plus aria-hidden="true" />Add a dog</NuxtLink></Button>
    </div>

    <AlertDialog :open="!!deleting" @update:open="o => !o && (deleting = undefined)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {{ deleting?.name }}?</AlertDialogTitle>
          <AlertDialogDescription>The draft and its photos and videos are removed for good. Buyers never saw it.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <Button :loading="busy" @click="confirmDelete">Delete draft</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
