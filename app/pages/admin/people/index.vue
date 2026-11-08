<script setup lang="ts">
import { Ban, MoreHorizontal, Search } from '@lucide/vue'
import { onMounted, ref, watch } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { AdminPerson } from '~/utils/admin'
import type { CsvColumn } from '~/utils/csv'
import { useAdminPeople } from '~/composables/useAdminPeople'
import { useNotify } from '~/composables/useNotify'
import { initialsOf } from '~/utils/account'
import { adminTime, storeStatusMeta } from '~/utils/admin'
import { storeRoles } from '~/utils/storeRoles'

// Admin › People: find any account by name, email or phone, with its stores and roles, staff role and activity.
// Block an account (with a reason it sees): it can still sign in and read, but can't add or change anything.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'People · Dogeash admin', robots: 'noindex' })

const { people, loading, search, block, unblock } = useAdminPeople()
const query = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
watch(query, (q) => {
  clearTimeout(timer)
  timer = setTimeout(() => search(q), 300)
})
onMounted(() => search())
const csv: CsvColumn<AdminPerson>[] = [
  { label: 'Name', value: p => p.name }, { label: 'Email', value: p => p.email }, { label: 'Phone', value: p => p.phone }, { label: 'City', value: p => p.city },
  { label: 'Staff', value: p => p.staff_role }, { label: 'Stores', value: p => p.stores.map(s => `${s.name} (${s.role})`).join('; ') },
  { label: 'Visits', value: p => p.visits }, { label: 'Conversations', value: p => p.conversations }, { label: 'Reviews', value: p => p.reviews },
  { label: 'Shortlisted', value: p => p.shortlisted }, { label: 'Joined', value: p => p.created_at }, { label: 'Last sign-in', value: p => p.last_sign_in_at },
  { label: 'Blocked', value: p => p.blocked?.reason ?? '' },
]

const pending = ref<{ person: AdminPerson, block: boolean }>()
const confirmOpen = ref(false)
function ask(person: AdminPerson, doBlock: boolean) {
  pending.value = { person, block: doBlock }
  confirmOpen.value = true
}
async function run(note: string) {
  const { person, block: doBlock } = pending.value!
  const error = doBlock ? await block(person, note, query.value) : await unblock(person, query.value)
  if (!error) useNotify().adminDone(doBlock ? `${person.name || person.email} blocked` : `${person.name || person.email} unblocked`, doBlock ? 'They can still read, but can\'t add or change anything. It\'s in the audit log.' : 'They can use Dogeash again.')
  return error
}
</script>

<template>
  <AdminPage title="People" :count="people.length" description="Every account: buyers, store owners and staff, newest first (up to 200; search to find anyone else).">
    <template #actions>
      <AdminExport name="people" :rows="people" :columns="csv" />
      <label class="relative">
        <span class="sr-only">Search people</span>
        <Search class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <Input v-model="query" type="search" placeholder="Name, email or phone" class="h-9 w-64 pl-8 text-sm" />
      </label>
    </template>

    <AdminCard flush>
      <div class="relative overflow-x-auto">
        <table v-if="people.length" class="w-full min-w-[960px] border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="px-5 py-2.5 font-medium">Person</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Phone · city</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Stores</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium" title="Visits · conversations · reviews · shortlisted dogs">Activity</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Joined</th>
              <th scope="col" class="px-5 py-2.5 font-medium">Last sign-in</th>
              <th scope="col" class="w-12"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in people" :key="p.id" class="align-top hover:bg-surface-sunk/60">
              <td class="border-t border-line px-5 py-2.5">
                <span class="flex items-center gap-3">
                  <span class="grid size-8 shrink-0 place-items-center rounded-full bg-surface-sunk text-[11px] font-bold">{{ initialsOf(p.name || p.email || '?') }}</span>
                  <span class="flex min-w-0 flex-col leading-tight">
                    <span class="flex items-center gap-1.5 font-medium">
                      <NuxtLink :to="`/admin/people/${p.id}`" class="text-ink hover:underline">{{ p.name || 'No name yet' }}</NuxtLink>
                      <span v-if="p.staff_role" class="rounded-full bg-marigold px-1.5 font-mono text-[10px] leading-4 font-semibold text-on-marigold uppercase">{{ p.staff_role }}</span>
                      <span v-if="p.blocked" class="inline-flex items-center gap-1 rounded-full bg-danger/12 px-1.5 font-mono text-[10px] leading-4 font-semibold text-danger uppercase" :title="p.blocked.reason"><Ban class="size-3" aria-hidden="true" />blocked</span>
                    </span>
                    <span class="truncate font-mono text-[11px] text-ink-muted">{{ p.email }}</span>
                  </span>
                </span>
              </td>
              <td class="border-t border-line px-3 py-2.5 text-ink-muted">
                <span class="flex flex-col leading-tight"><span>{{ p.phone || '—' }}</span><span class="text-[12px]">{{ p.city || '' }}</span></span>
              </td>
              <td class="border-t border-line px-3 py-2.5">
                <span v-if="p.stores.length" class="flex flex-col gap-1">
                  <span v-for="s in p.stores" :key="s.id" class="inline-flex items-center gap-1.5 text-[12.5px]">
                    <span class="size-2 shrink-0 rounded-full" :style="{ background: storeStatusMeta[s.status].color }" :title="storeStatusMeta[s.status].label" aria-hidden="true" />
                    {{ s.name }} <span class="text-ink-muted">· {{ storeRoles[s.role].label }}</span>
                  </span>
                </span>
                <span v-else class="text-[12.5px] text-ink-muted">Buyer</span>
              </td>
              <td class="border-t border-line px-3 py-2.5 text-right font-mono text-[12px] whitespace-nowrap tabular-nums" :title="`${p.visits} visits · ${p.conversations} conversations · ${p.reviews} reviews · ${p.shortlisted} shortlisted`">
                {{ p.visits }} · {{ p.conversations }} · {{ p.reviews }} · {{ p.shortlisted }}
              </td>
              <td class="border-t border-line px-3 py-2.5 font-mono text-[11.5px] whitespace-nowrap text-ink-muted">{{ adminTime(p.created_at) }}</td>
              <td class="border-t border-line px-5 py-2.5 font-mono text-[11.5px] whitespace-nowrap text-ink-muted">{{ p.last_sign_in_at ? adminTime(p.last_sign_in_at) : 'Never' }}</td>
              <td class="border-t border-line pr-3 text-right">
                <DropdownMenu v-if="!p.staff_role">
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="mt-0.5 size-8" :aria-label="`Actions for ${p.name || p.email}`"><MoreHorizontal aria-hidden="true" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
                    <DropdownMenuItem v-if="p.blocked" @select="ask(p, false)">Unblock</DropdownMenuItem>
                    <DropdownMenuItem v-else class="text-danger" @select="ask(p, true)">Block account</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
        <ListSkeleton v-else-if="loading" variant="table" :rows="5" label="Searching" />
        <p v-else class="m-0 px-5 py-4 text-[13px] text-ink-muted">Nobody matches.</p>
      </div>
      <p class="m-0 border-t border-line px-5 py-2.5 text-[11.5px] text-ink-muted">Activity: kennel visits · conversations · reviews · dogs shortlisted.</p>
    </AdminCard>

    <AdminConfirm
      v-if="pending"
      v-model:open="confirmOpen"
      :title="pending.block ? `Block ${pending.person.name || pending.person.email}?` : `Unblock ${pending.person.name || pending.person.email}?`"
      :description="pending.block ? 'They can still sign in and read, but can\'t message, book, review, list, save or upload anything, and see your reason at the top of every page. Their stores aren\'t suspended: do that in Stores if needed.' : (pending.person.blocked ? `Blocked because: ${pending.person.blocked.reason}` : '')"
      :confirm-label="pending.block ? 'Block account' : 'Unblock'"
      :reason-required="pending.block"
      reason-for="them"
      :no-note="!pending.block"
      :danger="pending.block"
      :run="run"
    />
  </AdminPage>
</template>
