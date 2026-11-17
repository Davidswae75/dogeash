<script setup lang="ts">
import { Ban, MoreHorizontal } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { definePageMeta, navigateTo, useSeoMeta } from '#imports' // nuxt
import type { DataColumn } from '~/components/list/ListTable.vue'
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

// Who: everyone, buyers, store people, staff, or blocked accounts (within the people loaded)
type Who = 'all' | 'buyers' | 'stores' | 'staff' | 'blocked'
const who = ref<Who>('all')
const inWho = (p: AdminPerson, w: Who) => w === 'all' || (w === 'buyers' ? !p.stores.length && !p.staff_role : w === 'stores' ? p.stores.length > 0 : w === 'staff' ? !!p.staff_role : !!p.blocked)
const tabs = computed(() => ([['all', 'All'], ['buyers', 'Buyers'], ['stores', 'Store people'], ['staff', 'Staff'], ['blocked', 'Blocked']] as const)
  .map(([value, label]) => ({ value, label, count: people.value.filter(p => inWho(p, value)).length, urgent: value === 'blocked' })))
const shown = computed(() => people.value.filter(p => inWho(p, who.value)))
function clearFilters() {
  who.value = 'all'
  query.value = ''
}
const columns: DataColumn[] = [
  { key: 'person', label: 'Person', mobile: 'title' },
  { key: 'contact', label: 'Phone · city', mobile: 'row' },
  { key: 'stores', label: 'Stores', mobile: 'row' },
  { key: 'activity', label: 'Activity', align: 'right', mono: true, mobile: 'row' },
  { key: 'joined', label: 'Joined', mobile: 'hide' },
  { key: 'seen', label: 'Last sign-in', mobile: 'meta' },
]
const personKey = (p: AdminPerson) => p.id
const personLabel = (p: AdminPerson) => p.name || p.email || 'Person'
const openPerson = (p: AdminPerson) => navigateTo(`/admin/people/${p.id}`)
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
      <AdminExport name="people" :rows="shown" :columns="csv" />
    </template>

    <div class="flex flex-col gap-4">
      <ListToolbar v-model:search="query" placeholder="Name, email or phone" :count="shown.length" :noun="['person', 'people']" :filtered="who !== 'all' || !!query.trim()" @clear="clearFilters">
        <template #tabs><ListTabs v-model="who" :tabs="tabs" label="Show people" /></template>
      </ListToolbar>

      <ListSkeleton v-if="loading && !people.length" variant="table" :rows="5" label="Searching" />
      <p v-else-if="!shown.length" class="m-0 rounded-xl bg-surface px-5 py-8 text-center text-sm text-ink-muted ring-1 ring-line">Nobody matches.</p>
      <ListTable v-else :rows="shown" :columns="columns" :row-key="personKey" :row-label="personLabel" min-width="900px" @open="openPerson">
        <template #cell-person="{ row }">
          <span class="flex items-center gap-3">
            <span class="grid size-9 shrink-0 place-items-center rounded-full bg-surface-sunk text-[11px] font-bold">{{ initialsOf(row.name || row.email || '?') }}</span>
            <span class="flex min-w-0 flex-col leading-tight">
              <span class="flex flex-wrap items-center gap-1.5 font-semibold">
                {{ row.name || 'No name yet' }}
                <span v-if="row.staff_role" class="rounded-full bg-marigold px-1.5 font-mono text-[10px] leading-4 font-semibold text-on-marigold uppercase">{{ row.staff_role }}</span>
                <span v-if="row.blocked" class="inline-flex items-center gap-1 rounded-full bg-danger/12 px-1.5 font-mono text-[10px] leading-4 font-semibold text-danger uppercase" :title="row.blocked.reason"><Ban class="size-3" aria-hidden="true" />blocked</span>
              </span>
              <span class="truncate font-mono text-[11px] font-normal text-ink-muted">{{ row.email }}</span>
            </span>
          </span>
        </template>
        <template #cell-contact="{ row }">
          <span class="flex flex-col leading-tight text-ink-muted"><span>{{ row.phone || '—' }}</span><span class="text-[12px]">{{ row.city || '' }}</span></span>
        </template>
        <template #cell-stores="{ row }">
          <span v-if="row.stores.length" class="flex flex-col gap-1">
            <span v-for="st in row.stores" :key="st.id" class="inline-flex items-center gap-1.5 text-[12.5px]">
              <span class="size-2 shrink-0 rounded-full" :style="{ background: storeStatusMeta[st.status as keyof typeof storeStatusMeta].color }" aria-hidden="true" />
              {{ st.name }} <span class="text-ink-muted">· {{ storeRoles[st.role as keyof typeof storeRoles].label }}</span>
            </span>
          </span>
          <span v-else class="text-[12.5px] text-ink-muted">Buyer</span>
        </template>
        <template #cell-activity="{ row }"><span class="whitespace-nowrap text-[12px]" :title="`${row.visits} visits · ${row.conversations} conversations · ${row.reviews} reviews · ${row.shortlisted} shortlisted`">{{ row.visits }} · {{ row.conversations }} · {{ row.reviews }} · {{ row.shortlisted }}</span></template>
        <template #cell-joined="{ row }"><span class="font-mono text-[11.5px] whitespace-nowrap text-ink-muted">{{ adminTime(row.created_at) }}</span></template>
        <template #cell-seen="{ row }"><span class="font-mono text-[11.5px] whitespace-nowrap text-ink-muted">{{ row.last_sign_in_at ? adminTime(row.last_sign_in_at) : 'Never signed in' }}</span></template>
        <template #actions="{ row }">
          <DropdownMenu v-if="!row.staff_role">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="size-8" :aria-label="`Actions for ${row.name || row.email}`"><MoreHorizontal aria-hidden="true" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-44 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
              <DropdownMenuItem v-if="row.blocked" @select="ask(row, false)">Unblock</DropdownMenuItem>
              <DropdownMenuItem v-else class="text-danger" @select="ask(row, true)">Block account</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>
      </ListTable>
      <p class="m-0 text-[11.5px] text-ink-muted">Activity: kennel visits · conversations · reviews · dogs shortlisted. Up to 200 people load at a time; search to find anyone else.</p>
    </div>

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
