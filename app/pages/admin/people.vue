<script setup lang="ts">
import { Search } from '@lucide/vue'
import { onMounted, ref, watch } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useAdminPeople } from '~/composables/useAdminPeople'
import { initialsOf } from '~/utils/account'
import { adminTime, storeStatusMeta } from '~/utils/admin'
import { storeRoles } from '~/utils/storeRoles'

// Admin › People: find any account by name, email or phone, with its stores and roles, staff role and activity.
// Looking only for now: blocking an account needs Supabase's server key, which the site never holds.
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'People · Dogeash admin', robots: 'noindex' })

const { people, loading, search } = useAdminPeople()
const query = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
watch(query, (q) => {
  clearTimeout(timer)
  timer = setTimeout(() => search(q), 300)
})
onMounted(() => search())
</script>

<template>
  <AdminPage title="People" :count="people.length" description="Every account: buyers, store owners and staff, newest first (up to 200; search to find anyone else).">
    <template #actions>
      <label class="relative">
        <span class="sr-only">Search people</span>
        <Search class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <Input v-model="query" type="search" placeholder="Name, email or phone" class="h-9 w-64 pl-8 text-sm" />
      </label>
    </template>

    <AdminCard flush>
      <div class="overflow-x-auto">
        <table v-if="people.length" class="w-full min-w-[960px] border-collapse text-left text-[13px]">
          <thead>
            <tr class="text-[11.5px] text-ink-muted">
              <th scope="col" class="px-5 py-2.5 font-medium">Person</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Phone · city</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Stores</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium" title="Visits · conversations · reviews · shortlisted dogs">Activity</th>
              <th scope="col" class="px-3 py-2.5 font-medium">Joined</th>
              <th scope="col" class="px-5 py-2.5 font-medium">Last sign-in</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in people" :key="p.id" class="align-top hover:bg-surface-sunk/60">
              <td class="border-t border-line px-5 py-2.5">
                <span class="flex items-center gap-3">
                  <span class="grid size-8 shrink-0 place-items-center rounded-full bg-surface-sunk text-[11px] font-bold">{{ initialsOf(p.name || p.email || '?') }}</span>
                  <span class="flex min-w-0 flex-col leading-tight">
                    <span class="flex items-center gap-1.5 font-medium">
                      {{ p.name || 'No name yet' }}
                      <span v-if="p.staff_role" class="rounded-full bg-marigold px-1.5 font-mono text-[10px] leading-4 font-semibold text-on-marigold uppercase">{{ p.staff_role }}</span>
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
            </tr>
          </tbody>
        </table>
        <p v-else class="m-0 px-5 py-4 text-[13px] text-ink-muted">{{ loading ? 'Searching…' : 'Nobody matches.' }}</p>
      </div>
      <p class="m-0 border-t border-line px-5 py-2.5 text-[11.5px] text-ink-muted">Activity: kennel visits · conversations · reviews · dogs shortlisted.</p>
    </AdminCard>
  </AdminPage>
</template>
