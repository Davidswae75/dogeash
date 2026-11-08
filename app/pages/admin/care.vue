<script setup lang="ts">
import { BadgeCheck, MoreHorizontal, Plus, Search } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { DetailSection } from '~/components/DetailDialog.vue'
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
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return providers.value.filter(p => !q || `${p.name} ${p.person ?? ''} ${p.city} ${careTypes[p.type].label}`.toLowerCase().includes(q))
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
      <label class="relative">
        <span class="sr-only">Search providers</span>
        <Search class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <Input v-model="query" type="search" placeholder="Name, city, type" class="h-9 w-56 pl-8 text-sm" />
      </label>
      <Button variant="marigold" size="sm" class="h-9" @click="openForm()"><Plus aria-hidden="true" />Add provider</Button>
    </template>

    <AdminCard flush>
      <div class="relative overflow-x-auto">
        <table v-if="shown.length" class="w-full min-w-[600px] border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="px-5 py-2.5 font-medium">Provider</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Type</th>
              <th scope="col" class="px-3 py-2.5 font-medium">City</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Managed by</th>
              <th scope="col" class="w-12"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <!-- A row shows the essentials; clicking it opens everything about the provider -->
            <tr v-for="p in shown" :key="p.id" class="cursor-pointer align-top hover:bg-surface-sunk/60" @click="openProvider(p)">
              <td class="border-t border-line px-5 py-2.5">
                <span class="flex flex-col leading-tight">
                  <button type="button" class="flex w-fit cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-left font-medium text-ink hover:underline" @click.stop="openProvider(p)">
                    {{ p.name }}<BadgeCheck v-if="p.verified" class="size-3.5 text-marigold" aria-label="Checked by Dogeash" /><span v-if="p.listed === false" class="rounded-full bg-surface-sunk px-1.5 font-mono text-[10px] leading-4 font-semibold text-ink-muted uppercase">hidden</span>
                  </button>
                  <span class="font-mono text-[11px] text-ink-muted">{{ p.id }}</span>
                </span>
              </td>
              <td class="border-t border-line px-3 py-2.5">{{ careTypes[p.type].label }}</td>
              <td class="border-t border-line px-3 py-2.5">{{ p.city }}</td>
              <td class="border-t border-line px-3 py-2.5">
                <span v-for="m in managedBy(p.id).members" :key="m.email" class="block leading-tight" :title="m.email">{{ m.name }}</span>
                <span v-for="i in managedBy(p.id).invites" :key="i.id" class="block font-mono text-[11px] text-ink-muted">invited: {{ i.email }}</span>
                <span v-if="!managedBy(p.id).members.length && !managedBy(p.id).invites.length" class="text-[12px] text-ink-muted">Dogeash</span>
              </td>
              <td class="border-t border-line pr-3 text-right" @click.stop>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="mt-1 size-8" :aria-label="`Actions for ${p.name}`"><MoreHorizontal aria-hidden="true" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-40 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
                    <DropdownMenuItem @select="openForm(p)">Edit</DropdownMenuItem>
                    <DropdownMenuItem @select="openForm(p)">Invite to manage</DropdownMenuItem>
                    <DropdownMenuItem class="text-danger" @select="removing = p; confirmOpen = true">Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
        <ListSkeleton v-else-if="!loaded" variant="table" :rows="5" label="Loading providers" />
        <p v-else class="m-0 px-5 py-4 text-[13px] text-ink-muted">{{ providers.length ? 'No providers match.' : 'No providers yet.' }}</p>
      </div>
    </AdminCard>

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
