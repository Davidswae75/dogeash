<script setup lang="ts">
import { BadgeCheck, MoreHorizontal, Plus } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { DetailSection } from '~/components/DetailDialog.vue'
import type { DataColumn } from '~/components/list/ListTable.vue'
import type { CareType } from '~/utils/care'
import type { CareProvider } from '~/utils/care'
import { useAdminCare } from '~/composables/useAdminCare'
import { useNotify } from '~/composables/useNotify'
import { careProviderSlug, careTypes } from '~/utils/care'
import { formatNaira } from '~/utils/dogs'
import { storesForProvider } from '~/utils/stores'

// Admin › Care directory: the vets, trainers, groomers, kennel builders, equipment and boarding providers.
// Add, edit (including the "checked by Dogeash" badge) and remove them; stores link to them from their care team.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Care directory · Dogeash admin', robots: 'noindex' })

const { providers, loaded, managedBy, load, save, remove, inviteAll } = useAdminCare()
onMounted(load)

const query = ref('')
// Listed or hidden, and the kind of care
const show = ref<'all' | 'listed' | 'hidden'>('all')
const kinds = ref<CareType[]>([])
const kindOptions = (Object.keys(careTypes) as CareType[]).map(k => ({ value: k, label: careTypes[k].label }))
const tabs = computed(() => [
  { value: 'all' as const, label: 'All', count: providers.value.length },
  { value: 'listed' as const, label: 'Listed', count: providers.value.filter(p => p.listed !== false).length },
  { value: 'hidden' as const, label: 'Hidden', count: providers.value.filter(p => p.listed === false).length },
])
function clearFilters() {
  show.value = 'all'
  kinds.value = []
  query.value = ''
}
const columns: DataColumn[] = [
  { key: 'name', label: 'Provider', mobile: 'title' },
  { key: 'type', label: 'Type', mobile: 'meta' },
  { key: 'city', label: 'City', mobile: 'row' },
  { key: 'managers', label: 'Managed by', mobile: 'row' },
]
const providerKey = (p: CareProvider) => p.id
const providerLabel = (p: CareProvider) => `${p.name}, ${careTypes[p.type].label}`
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return providers.value
    .filter(p => show.value === 'all' || (show.value === 'hidden' ? p.listed === false : p.listed !== false))
    .filter(p => !kinds.value.length || kinds.value.includes(p.type))
    .filter(p => !q || `${p.name} ${p.person ?? ''} ${p.city} ${careTypes[p.type].label}`.toLowerCase().includes(q))
})

const editing = ref<CareProvider>()
const formOpen = ref(false)
function openForm(p?: CareProvider) {
  editing.value = p
  formOpen.value = true
}
async function onSave(p: Parameters<typeof save>[0], emails: string[]) {
  const out = await save(p, emails)
  if (out.error) return out
  const emailed = out.invites.filter(i => i.emailed).length
  const what = p.id ? `${p.name} saved` : `${p.name} ${p.listed === false ? 'added, hidden for now' : 'added and listed'}`
  const notSent = out.invites.filter(i => !i.invited || !i.emailed)
  if (!notSent.length) {
    useNotify().adminDone(what, emailed ? `Invitations emailed to ${emailed} ${emailed === 1 ? 'person' : 'people'}.` : p.listed === false ? "Buyers won't see it until you list it." : 'The public care directory is updated.')
  }
  else {
    // Saved, but some emails didn't go: say so here as well as in the form
    useNotify().failed(`${what}. ${emailed ? `Emailed ${emailed}; ` : ''}not emailed: ${notSent.map(i => i.email).join(', ')}. The form says why.`)
  }
  return out
}
// Emailing a waiting invitation again (from the form)
const resend = (email: string) => inviteAll(editing.value!.id, [email])

// Everything about one provider
const viewing = ref<CareProvider>()
const viewOpen = ref(false)
function openProvider(p: CareProvider) {
  viewing.value = p
  viewOpen.value = true
}
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const providerSections = computed<DetailSection[]>(() => {
  const p = viewing.value
  if (!p) return []
  const team = managedBy(p.id)
  const stores = storesForProvider(p.id)
  return [
    { title: 'Listing', rows: [
      { label: 'ID', value: p.id, mono: true },
      { label: 'Shown to buyers', value: p.listed === false ? 'Hidden' : 'Listed', ...(p.listed === false ? {} : { to: `/care/${careProviderSlug(p)}`, external: true }) },
      { label: 'What they do', value: careTypes[p.type].label },
      { label: 'Person in charge', value: p.person },
      { label: 'Credential', value: p.credential },
      { label: 'Checked by Dogeash', value: p.verified ? 'Yes (shows the badge)' : 'Not yet' },
      { label: 'Rating', value: p.reviews ? `${p.rating} from ${p.reviews} reviews` : 'No reviews yet' },
      { label: 'About', value: p.about, long: true },
    ] },
    { title: 'Where and when', rows: [
      { label: 'City', value: p.city },
      { label: 'Areas covered', value: p.areas },
      { label: 'Home visits', value: p.homeVisits ? 'Yes' : 'No' },
      { label: 'Price from', value: formatNaira(p.priceFrom), mono: true },
      { label: 'Opening hours', value: p.hours },
      { label: 'Taking bookings', value: p.takingBookings === false ? 'Paused' : 'Yes' },
      { label: 'Booking days', value: p.weekdays?.map(d => dayNames[d]).join(', ') },
      { label: 'Booking times', value: p.slots?.join(', '), mono: true },
    ] },
    { title: 'People', rows: [
      { label: 'Managed by', value: team.members.length ? team.members.map(m => `${m.name} (${m.email})`).join('\n') : 'Dogeash', long: true },
      { label: 'Invited, not accepted yet', value: team.invites.map(i => i.email).join('\n'), long: true },
      { label: 'Stores working with them', value: stores.length ? stores.map(s => s.store.name).join(', ') : 'None yet', long: true },
    ] },
  ]
})
function fromDialog(action: 'edit' | 'remove') {
  const p = viewing.value!
  viewOpen.value = false
  if (action === 'edit') openForm(p)
  else {
    removing.value = p
    confirmOpen.value = true
  }
}

const removing = ref<CareProvider>()
const confirmOpen = ref(false)
async function onRemove() {
  const error = await remove(removing.value!)
  if (!error) useNotify().adminDone(`${removing.value!.name} removed`, 'Gone from the directory and from every store\'s care team.')
  return error
}
</script>

<template>
  <AdminPage title="Care directory" :count="providers.length" description="Providers buyers can find and book, and stores can add to their care team. Add the business, invite whoever runs it, and list it when it&apos;s ready.">
    <template #actions>
      <Button variant="marigold" size="sm" class="h-9" @click="openForm()"><Plus aria-hidden="true" />Add provider</Button>
    </template>

    <div class="flex flex-col gap-4">
      <ListToolbar v-model:search="query" placeholder="Name, person, city, type" :count="shown.length" :noun="['provider', 'providers']" :filtered="show !== 'all' || !!kinds.length || !!query.trim()" @clear="clearFilters">
        <template #tabs><ListTabs v-model="show" :tabs="tabs" label="Show providers" /></template>
        <template #filters><ListFilter v-model="kinds" label="Type" :options="kindOptions" /></template>
      </ListToolbar>

      <ListSkeleton v-if="!loaded" variant="table" :rows="5" label="Loading providers" />
      <p v-else-if="!shown.length" class="m-0 rounded-xl bg-surface px-5 py-8 text-center text-sm text-ink-muted ring-1 ring-line">{{ providers.length ? 'No providers match.' : 'No providers yet.' }}</p>
      <!-- A row shows the essentials; clicking it opens everything about the provider -->
      <ListTable v-else :rows="shown" :columns="columns" :row-key="providerKey" :row-label="providerLabel" @open="openProvider">
        <template #cell-name="{ row }">
          <span class="flex flex-col leading-tight">
            <span class="flex items-center gap-1.5 font-semibold">{{ row.name }}<BadgeCheck v-if="row.verified" class="size-3.5 text-marigold" aria-label="Checked by Dogeash" /><span v-if="row.listed === false" class="rounded-full bg-surface-sunk px-1.5 font-mono text-[10px] leading-4 font-semibold text-ink-muted uppercase">hidden</span></span>
            <span class="font-mono text-[11px] text-ink-muted">{{ row.id }}</span>
          </span>
        </template>
        <template #cell-type="{ row }">{{ careTypes[row.type as CareType].label }}</template>
        <template #cell-managers="{ row }">
          <span v-for="m in managedBy(row.id).members" :key="m.email" class="block leading-tight" :title="m.email">{{ m.name }}</span>
          <span v-for="i in managedBy(row.id).invites" :key="i.id" class="block font-mono text-[11px] text-ink-muted">invited: {{ i.email }}</span>
          <span v-if="!managedBy(row.id).members.length && !managedBy(row.id).invites.length" class="text-[12px] text-ink-muted">Dogeash</span>
        </template>
        <template #actions="{ row }">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="size-8" :aria-label="`Actions for ${row.name}`"><MoreHorizontal aria-hidden="true" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-40 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
              <DropdownMenuItem @select="openForm(row)">Edit</DropdownMenuItem>
              <DropdownMenuItem @select="openForm(row)">Invite to manage</DropdownMenuItem>
              <DropdownMenuItem class="text-danger" @select="removing = row; confirmOpen = true">Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>
      </ListTable>
    </div>

    <DetailDialog v-if="viewing" v-model:open="viewOpen" :title="viewing.name" :subtitle="`${careTypes[viewing.type].label} · ${viewing.city}`" :sections="providerSections">
      <template #actions>
        <Button variant="ghost" class="text-danger" @click="fromDialog('remove')">Remove</Button>
        <Button variant="marigold" @click="fromDialog('edit')">Edit</Button>
      </template>
    </DetailDialog>

    <AdminProviderForm v-model:open="formOpen" :provider="editing" :managers="editing ? managedBy(editing.id) : undefined" :save="onSave" :resend="editing ? resend : undefined" />

    <AdminConfirm
      v-if="removing"
      v-model:open="confirmOpen"
      :title="`Remove ${removing.name}?`"
      :description="`They leave the public directory and every store's care team (${storesForProvider(removing.id).length} now). This can't be undone; you can add them again.`"
      confirm-label="Remove provider"
      no-note
      danger
      :run="() => onRemove()"
    />
  </AdminPage>
</template>
