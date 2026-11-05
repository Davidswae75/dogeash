<script setup lang="ts">
import { Dog as DogIcon, MoreHorizontal, Search } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useRuntimeConfig, useSeoMeta } from '#imports' // nuxt
import type { AdminDog, DogStatus } from '~/utils/admin'
import { useAdminListings } from '~/composables/useAdminListings'
import { useNotify } from '~/composables/useNotify'
import { adminTime, dogActions, dogStatusMeta } from '~/utils/admin'
import { dogPhotoUrl, formatNaira } from '~/utils/dogs'

// Admin › Listings: every dog in any status. Take one down (the store reads why), put it back, or approve
// one waiting for review. Drafts and sold dogs are the store's own business, so they have no actions.
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Listings · Dogeash admin', robots: 'noindex' })

const { dogs, loaded, load, setStatus } = useAdminListings()
const storageUrl = useRuntimeConfig().public.supabase.url as string
onMounted(load)

const filter = ref<DogStatus | 'all'>('all')
const filterModel = computed({ get: () => filter.value, set: (v: string) => { if (v) filter.value = v as DogStatus | 'all' } })
const query = ref('')
const statuses = Object.keys(dogStatusMeta) as DogStatus[]
const countOf = (s: DogStatus) => dogs.value.filter(d => d.status === s).length
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
      <div class="overflow-x-auto">
        <table v-if="shown.length" class="w-full min-w-[880px] border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="border-t border-line px-5 py-2 font-medium">Dog</th>
              <th scope="col" class="border-t border-line px-3 py-2 font-medium">Store</th>
              <th scope="col" class="border-t border-line px-3 py-2 font-medium">Status</th>
              <th scope="col" class="border-t border-line px-3 py-2 text-right font-medium">Price</th>
              <th scope="col" class="border-t border-line px-3 py-2 font-medium">Updated · Dogeash note</th>
              <th scope="col" class="w-12 border-t border-line"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in shown" :key="d.id" class="align-top hover:bg-surface-sunk/60">
              <td class="border-t border-line px-5 py-2.5">
                <span class="flex items-center gap-3">
                  <img v-if="d.photo_path" :src="dogPhotoUrl(d.photo_path, storageUrl)" alt="" class="size-10 shrink-0 rounded-md object-cover">
                  <span v-else class="grid size-10 shrink-0 place-items-center rounded-md bg-surface-sunk text-ink-muted"><DogIcon class="size-4" aria-hidden="true" /></span>
                  <span class="flex min-w-0 flex-col leading-tight">
                    <NuxtLink v-if="d.status === 'available' || d.status === 'reserved'" :to="`/dogs/${d.file_no.toLowerCase()}`" target="_blank" class="font-medium text-ink">{{ d.name }}</NuxtLink>
                    <span v-else class="font-medium">{{ d.name }}</span>
                    <span class="font-mono text-[11px] text-ink-muted">{{ d.file_no }} · {{ d.breed }} · L{{ d.level }}</span>
                  </span>
                </span>
              </td>
              <td class="border-t border-line px-3 py-2.5">
                <span class="flex flex-col leading-tight">
                  <span>{{ d.store_name }}</span>
                  <span class="font-mono text-[11px] text-ink-muted">{{ d.store_id }}<template v-if="d.store_status !== 'verified'"> · store {{ d.store_status.replace('_', ' ') }}</template></span>
                </span>
              </td>
              <td class="border-t border-line px-3 py-2.5">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-surface-sunk px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                  <span class="size-2 rounded-full" :style="{ background: dogStatusMeta[d.status].color }" aria-hidden="true" />{{ dogStatusMeta[d.status].label }}
                </span>
              </td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono whitespace-nowrap tabular-nums">{{ formatNaira(d.price_naira) }}</td>
              <td class="max-w-[260px] border-t border-line px-3 py-2.5">
                <span class="flex flex-col leading-snug">
                  <span class="font-mono text-[11px] text-ink-muted">{{ adminTime(d.updated_at) }}</span>
                  <span v-if="d.admin_note" class="line-clamp-2 text-[12.5px]" :title="d.admin_note">{{ d.admin_note }}</span>
                </span>
              </td>
              <td class="border-t border-line pr-3 text-right">
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
        <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">{{ !loaded ? 'Loading…' : dogs.length ? 'No listings match.' : 'No dogs yet.' }}</p>
      </div>
    </AdminCard>

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
