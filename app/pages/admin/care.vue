<script setup lang="ts">
import { BadgeCheck, MoreHorizontal, Plus, Search } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
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

const { providers, loaded, managedBy, lastEmailSent, load, save, remove, invite } = useAdminCare()
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
async function onSave(p: Parameters<typeof save>[0]) {
  const error = await save(p)
  if (!error) useNotify().adminDone(p.id ? `${p.name} saved` : `${p.name} added`, 'The public care directory is updated.')
  return error
}

// Inviting someone (the vet, the trainer) to manage their own listing
const inviting = ref<CareProvider>()
const inviteOpen = ref(false)
const inviteEmail = ref('')
const inviteError = ref('')
const inviteBusy = ref(false)
function openInvite(p: CareProvider) {
  inviting.value = p
  inviteEmail.value = ''
  inviteError.value = ''
  inviteOpen.value = true
}
async function sendInvite() {
  inviteBusy.value = true
  inviteError.value = (await invite(inviting.value!, inviteEmail.value)) ?? ''
  inviteBusy.value = false
  if (inviteError.value) return
  inviteOpen.value = false
  useNotify().adminDone(`Invitation sent for ${inviting.value!.name}`, lastEmailSent.value
    ? 'We emailed them a link. It also waits in their account when they sign in or sign up with that email.'
    : 'It waits in their account when they sign in or sign up with that email. (No email sent: email isn\'t set up yet.)')
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
  <AdminPage title="Care directory" :count="providers.length" description="Providers buyers can find and book, and stores can add to their care team. Only Dogeash adds them, for now.">
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
        <table v-if="shown.length" class="w-full min-w-[920px] border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="px-5 py-2.5 font-medium">Provider</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Type</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Where</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">From</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Stores</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Managed by</th>
              <th scope="col" class="w-12"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in shown" :key="p.id" class="align-top hover:bg-surface-sunk/60">
              <td class="border-t border-line px-5 py-2.5">
                <span class="flex flex-col leading-tight">
                  <NuxtLink :to="`/care/${careProviderSlug(p)}`" target="_blank" class="flex items-center gap-1.5 font-medium text-ink">
                    {{ p.name }}<BadgeCheck v-if="p.verified" class="size-3.5 text-marigold" aria-label="Checked by Dogeash" />
                  </NuxtLink>
                  <span class="font-mono text-[11px] text-ink-muted">{{ p.id }}<template v-if="p.person"> · {{ p.person }}</template></span>
                </span>
              </td>
              <td class="border-t border-line px-3 py-2.5">{{ careTypes[p.type].label }}</td>
              <td class="border-t border-line px-3 py-2.5">
                <span class="flex flex-col leading-tight"><span>{{ p.city }}</span><span class="text-[12px] text-ink-muted">{{ p.areas }}{{ p.homeVisits ? ' · home visits' : '' }}</span></span>
              </td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono whitespace-nowrap tabular-nums">{{ formatNaira(p.priceFrom) }}</td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono tabular-nums">{{ storesForProvider(p.id).length }}</td>
              <td class="border-t border-line px-3 py-2.5">
                <span v-for="m in managedBy(p.id).members" :key="m.email" class="block leading-tight" :title="m.email">{{ m.name }}</span>
                <span v-for="i in managedBy(p.id).invites" :key="i.id" class="block font-mono text-[11px] text-ink-muted">invited: {{ i.email }}</span>
                <span v-if="!managedBy(p.id).members.length && !managedBy(p.id).invites.length" class="text-[12px] text-ink-muted">Dogeash</span>
              </td>
              <td class="border-t border-line pr-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="mt-1 size-8" :aria-label="`Actions for ${p.name}`"><MoreHorizontal aria-hidden="true" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-40 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
                    <DropdownMenuItem @select="openForm(p)">Edit</DropdownMenuItem>
                    <DropdownMenuItem @select="openInvite(p)">Invite to manage</DropdownMenuItem>
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

    <AdminProviderForm v-model:open="formOpen" :provider="editing" :save="onSave" />

    <Dialog v-model:open="inviteOpen">
      <DialogContent class="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Invite someone to manage {{ inviting?.name }}</DialogTitle>
          <DialogDescription>They'll answer bookings, keep the listing's details up to date, and add visits to dogs' records when owners allow it. The name, type, city, credential and badge stay with Dogeash.</DialogDescription>
        </DialogHeader>
        <form class="flex flex-col gap-3" novalidate @submit.prevent="sendInvite">
          <FieldShell label="Their email" for="provider-invite-email" hint="The email they sign in with, or will sign up with.">
            <Input id="provider-invite-email" v-model="inviteEmail" type="email" autocomplete="off" placeholder="halima@kujevets.ng" class="h-10" />
          </FieldShell>
          <p v-if="inviteError" class="m-0 text-sm font-semibold text-danger" role="alert">{{ inviteError }}</p>
          <DialogFooter>
            <Button type="submit" variant="marigold" :loading="inviteBusy">Send invitation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
