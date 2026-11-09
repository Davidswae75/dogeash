<script setup lang="ts">
import { Pin, Plus } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
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
const filterModel = computed({ get: () => filter.value, set: (v) => { if (v) filter.value = v } })
const inGroup = (d: StoreDog, g: typeof groups[number]) => !g.statuses.length || g.statuses.includes(d.status)
const shown = computed(() => dogs.value.filter(d => inGroup(d, groups.find(g => g.value === filter.value)!)))

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

    <ToggleGroup v-if="dogs.length" v-model="filterModel" type="single" variant="chip" aria-label="Show dogs" class="flex w-auto flex-wrap justify-start gap-2">
      <ToggleGroupItem v-for="g in groups" :key="g.value" :value="g.value" class="rounded-full!">
        {{ g.label }} <span class="font-mono opacity-70">{{ dogs.filter(d => inGroup(d, g)).length }}</span>
      </ToggleGroupItem>
    </ToggleGroup>

    <ListSkeleton v-if="!loaded" variant="table" :rows="4" class="overflow-hidden rounded-xl bg-surface ring-1 ring-line" label="Loading your dogs" />
    <DashboardDogTable v-else-if="shown.length" :dogs="shown" :verified="verified" :can-delete="role !== 'handler'" @status="storeDogs.changeStatus" @remove="d => (deleting = d)" @pin="storeDogs.togglePin" />
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
