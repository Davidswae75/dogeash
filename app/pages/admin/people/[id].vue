<script setup lang="ts">
import { ArrowLeft, Ban } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { definePageMeta, useRoute, useSeoMeta } from '#imports' // nuxt
import type { AdminPersonDetail } from '~/composables/useAdminDetail'
import { useAdminDetail } from '~/composables/useAdminDetail'
import { useAdminPeople } from '~/composables/useAdminPeople'
import { useNotify } from '~/composables/useNotify'
import { initialsOf } from '~/utils/account'
import { adminTime, storeStatusMeta } from '~/utils/admin'
import { reasonLabel, reportKinds } from '~/utils/reports'
import { storeRoles } from '~/utils/storeRoles'
import { visitDay } from '~/utils/time'

// Admin › People › one account: who they are, their stores and roles, their activity (visits, conversations
// with counts and dates but never message text, reviews, reports they made), and admin actions about them.
// Block or unblock from here too.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Person · Dogeash admin', robots: 'noindex' })

const id = String(useRoute().params.id)
const detail = useAdminDetail()
const people = useAdminPeople()
const d = ref<AdminPersonDetail | null>(null)
const load = async () => { d.value = await detail.person(id) }
onMounted(load)

const confirmOpen = ref(false)
async function run(note: string) {
  const p = d.value!
  const target = { id, name: p.person.name, email: p.person.email } as Parameters<typeof people.block>[0]
  const error = p.blocked ? await people.unblock(target) : await people.block(target, note)
  if (!error) {
    useNotify().adminDone(p.blocked ? 'Account unblocked' : 'Account blocked', p.blocked ? 'They can use Dogeash again.' : 'They can still read, but can\'t add or change anything.')
    await load()
  }
  return error
}
const label = 'font-mono text-[10.5px] tracking-[.12em] text-ink-muted uppercase'
</script>

<template>
  <div class="flex flex-col gap-5">
    <NuxtLink to="/admin/people" class="inline-flex w-fit items-center gap-1.5 text-sm text-ink-muted no-underline hover:text-ink"><ArrowLeft class="size-4" aria-hidden="true" />People</NuxtLink>
    <p v-if="detail.error.value" class="m-0 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger ring-1 ring-danger/30" role="alert">{{ detail.error.value }}</p>
    <p v-else-if="!d" class="m-0 text-sm text-ink-muted">Loading…</p>

    <template v-if="d">
      <header class="flex flex-wrap items-center gap-4">
        <span class="grid size-14 place-items-center rounded-full bg-surface-sunk text-lg font-bold ring-1 ring-line">{{ initialsOf(d.person.name || d.person.email) }}</span>
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <h1 class="m-0 flex flex-wrap items-center gap-2.5 text-[26px] leading-8 font-semibold tracking-tight">
            {{ d.person.name || 'No name yet' }}
            <span v-if="d.staff_role" class="rounded-full bg-marigold px-2 font-mono text-[11px] leading-5 font-semibold text-on-marigold uppercase">{{ d.staff_role }}</span>
            <span v-if="d.blocked" class="inline-flex items-center gap-1 rounded-full bg-danger/12 px-2 font-mono text-[11px] leading-5 font-semibold text-danger uppercase"><Ban class="size-3.5" aria-hidden="true" />blocked</span>
          </h1>
          <span class="font-mono text-[12px] text-ink-muted">{{ d.person.email }}<template v-if="d.person.phone"> · {{ d.person.phone }}</template><template v-if="d.person.city"> · {{ d.person.city }}</template></span>
          <span class="text-[12.5px] text-ink-muted">Joined {{ adminTime(d.person.created_at) }} · last signed in {{ d.person.last_sign_in_at ? adminTime(d.person.last_sign_in_at) : 'never' }}</span>
        </span>
        <Button v-if="!d.staff_role" :variant="d.blocked ? 'outline' : 'default'" size="sm" @click="confirmOpen = true">{{ d.blocked ? 'Unblock' : 'Block account' }}</Button>
      </header>
      <p v-if="d.blocked" class="m-0 rounded-lg bg-danger/10 px-3.5 py-2.5 text-[13px] ring-1 ring-danger/30"><strong class="font-semibold">Blocked {{ adminTime(d.blocked.blocked_at) }}:</strong> {{ d.blocked.reason }}</p>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div class="flex min-w-0 flex-col gap-5">
          <AdminCard :title="`Kennel visits (${d.visits.length})`" flush>
            <ul v-if="d.visits.length" class="m-0 flex list-none flex-col p-0">
              <li v-for="(v, i) in d.visits" :key="i" class="flex items-center gap-3 border-t border-line px-5 py-2.5 text-[13px]">
                <span class="w-28 shrink-0 font-mono text-[12px]">{{ visitDay(v.day).label }} · {{ v.slot }}</span>
                <NuxtLink :to="`/admin/stores/${v.store_id}`" class="flex-1 text-ink">{{ v.store }}</NuxtLink>
                <span class="text-xs text-ink-muted">{{ v.status }}</span>
              </li>
            </ul>
            <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">No visits.</p>
          </AdminCard>

          <AdminCard :title="`Conversations (${d.conversations.length})`" description="Counts and dates only. Message text is only readable through a report." flush>
            <ul v-if="d.conversations.length" class="m-0 flex list-none flex-col p-0">
              <li v-for="(c, i) in d.conversations" :key="i" class="flex items-center gap-3 border-t border-line px-5 py-2.5 text-[13px]">
                <NuxtLink :to="`/admin/stores/${c.store_id}`" class="flex-1 text-ink">{{ c.store }}</NuxtLink>
                <span class="text-xs text-ink-muted">{{ c.messages }} messages · last {{ adminTime(c.last_message_at) }}</span>
              </li>
            </ul>
            <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">No conversations.</p>
          </AdminCard>

          <AdminCard :title="`Reviews written (${d.reviews.length})`" flush>
            <ul v-if="d.reviews.length" class="m-0 flex list-none flex-col p-0">
              <li v-for="r in d.reviews" :key="r.id" class="flex flex-col gap-1 border-t border-line px-5 py-3 text-[13px]">
                <span class="flex items-center gap-2"><ReviewStars :rating="r.rating" /><NuxtLink :to="`/admin/stores/${r.store_id}`" class="font-semibold text-ink">{{ r.store }}</NuxtLink><span class="ml-auto font-mono text-[11px] text-ink-muted">{{ adminTime(r.created_at) }}</span></span>
                <span class="line-clamp-2 text-ink-muted">{{ r.body }}</span>
              </li>
            </ul>
            <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">No reviews.</p>
          </AdminCard>

          <AdminCard title="History" description="Admin actions about this account (and by it, for staff)" flush>
            <div class="border-t border-line"><AdminAuditList :entries="d.audit" /></div>
          </AdminCard>
        </div>

        <div class="flex min-w-0 flex-col gap-5">
          <AdminCard :title="`Stores (${d.stores.length})`" flush>
            <ul v-if="d.stores.length" class="m-0 flex list-none flex-col p-0">
              <li v-for="s in d.stores" :key="s.id" class="border-t border-line">
                <NuxtLink :to="`/admin/stores/${s.id}`" class="flex items-center gap-2 px-5 py-2.5 text-[13px] text-ink no-underline hover:bg-surface-sunk/60">
                  <span class="size-2 rounded-full" :style="{ background: storeStatusMeta[s.status].color }" aria-hidden="true" />
                  <span class="flex-1 font-semibold">{{ s.name }}</span>
                  <span class="text-xs text-ink-muted">{{ storeRoles[s.role].label }}</span>
                </NuxtLink>
              </li>
            </ul>
            <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">A buyer: not on any store's team.</p>
          </AdminCard>

          <AdminCard title="Profile">
            <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
              <dt :class="label">Home</dt><dd class="m-0">{{ d.person.property ?? '—' }}</dd>
              <dt :class="label">Experience</dt><dd class="m-0">{{ d.person.experience ?? '—' }}</dd>
              <dt :class="label">Reach by</dt><dd class="m-0">{{ [d.person.notify.email && 'email', d.person.notify.sms && 'SMS', d.person.notify.whatsapp && 'WhatsApp'].filter(Boolean).join(', ') || '—' }}</dd>
              <dt :class="label">Shortlist</dt><dd class="m-0">{{ d.shortlisted }} dogs</dd>
            </dl>
          </AdminCard>

          <AdminCard :title="`Reports made (${d.reports_made.length})`" flush>
            <ul v-if="d.reports_made.length" class="m-0 flex list-none flex-col p-0">
              <li v-for="(r, i) in d.reports_made" :key="i" class="flex items-center gap-2 border-t border-line px-5 py-2.5 text-[13px]">
                <span class="font-mono text-[11px] uppercase">{{ reportKinds[r.kind as keyof typeof reportKinds] }}</span>
                <span class="flex-1">{{ reasonLabel(r.reason) }}</span>
                <span class="text-xs text-ink-muted">{{ r.status }}</span>
              </li>
            </ul>
            <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">None.</p>
          </AdminCard>
        </div>
      </div>

      <AdminConfirm
        v-model:open="confirmOpen"
        :title="d.blocked ? `Unblock ${d.person.name || d.person.email}?` : `Block ${d.person.name || d.person.email}?`"
        :description="d.blocked ? `Blocked because: ${d.blocked.reason}` : 'They can still sign in and read, but can\'t message, book, review, list, save or upload anything, and see your reason on every page.'"
        :confirm-label="d.blocked ? 'Unblock' : 'Block account'"
        :reason-required="!d.blocked"
        reason-for="them"
        :no-note="!!d.blocked"
        :danger="!d.blocked"
        :run="run"
      />
    </template>
  </div>
</template>
