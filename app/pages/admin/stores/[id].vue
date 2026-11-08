<script setup lang="ts">
import { ArrowLeft, ArrowUpRight, Ban, MoreHorizontal } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useRoute, useRuntimeConfig, useSeoMeta } from '#imports' // nuxt
import type { AdminStoreDetail } from '~/composables/useAdminDetail'
import type { StoreStatus } from '~/utils/admin'
import { useAdmin } from '~/composables/useAdmin'
import { useAdminDetail } from '~/composables/useAdminDetail'
import { useNotify } from '~/composables/useNotify'
import { initialsOf } from '~/utils/account'
import { adminTime, dogStatusMeta, storeActionEffect, storeActions, storeStatusMeta } from '~/utils/admin'
import { dogPhotoUrl, formatNaira } from '~/utils/dogs'
import { inspectionStatusMeta, inspectionWhen } from '~/utils/inspections'
import { storeRoles } from '~/utils/storeRoles'
import { visitDay } from '~/utils/time'

// Admin › Stores › one store: everything in one place. Status and its actions, the team (with emails),
// dogs, reviews, visits, the application, inspections, open reports, and its history in the audit log.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Store · Dogeash admin', robots: 'noindex' })

const id = String(useRoute().params.id)
const detail = useAdminDetail()
const storageUrl = useRuntimeConfig().public.supabase.url as string
const d = ref<AdminStoreDetail | null>(null)
const load = async () => { d.value = await detail.store(id) }
onMounted(load)

const visitTotal = computed(() => Object.values(d.value?.visits.by_status ?? {}).reduce((s, n) => s + n, 0))

const pending = ref<{ to: StoreStatus, label: string, reason: boolean }>()
const confirmOpen = ref(false)
function ask(action: { to: StoreStatus, label: string, reason: boolean }) {
  pending.value = action
  confirmOpen.value = true
}
async function run(note: string) {
  const error = await useAdmin().setStoreStatus({ public_id: id }, pending.value!.to, note)
  if (!error) {
    useNotify().adminDone(`${d.value!.store.name}: ${storeStatusMeta[pending.value!.to].label.toLowerCase()}`, 'The store has been told. It\'s in the audit log.')
    await load()
  }
  return error
}
const section = 'font-mono text-[10.5px] tracking-[.12em] text-ink-muted uppercase'
</script>

<template>
  <div class="flex flex-col gap-5">
    <NuxtLink to="/admin/stores" class="inline-flex w-fit items-center gap-1.5 text-sm text-ink-muted no-underline hover:text-ink"><ArrowLeft class="size-4" aria-hidden="true" />Stores</NuxtLink>
    <p v-if="detail.error.value" class="m-0 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger ring-1 ring-danger/30" role="alert">{{ detail.error.value }}</p>
    <ListSkeleton v-else-if="!d" :rows="3" />

    <template v-if="d">
      <header class="flex flex-wrap items-center gap-4">
        <span class="grid size-14 place-items-center rounded-2xl bg-night text-lg font-bold text-on-night">{{ initialsOf(d.store.name) }}</span>
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <h1 class="m-0 flex flex-wrap items-center gap-2.5 text-[26px] leading-8 font-semibold tracking-tight">
            {{ d.store.name }}
            <span class="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium ring-1 ring-line">
              <span class="size-2 rounded-full" :style="{ background: storeStatusMeta[d.store.status].color }" aria-hidden="true" />{{ storeStatusMeta[d.store.status].label }}
            </span>
          </h1>
          <span class="font-mono text-[12px] text-ink-muted">{{ d.store.public_id }} · {{ [...new Set([d.store.area, d.store.city, d.store.state].filter(Boolean))].join(', ') }} · opened {{ adminTime(d.store.created_at) }}</span>
        </span>
        <div class="flex flex-wrap items-center gap-2">
          <Button v-if="d.store.status === 'verified'" as-child variant="outline" size="sm"><NuxtLink :to="`/stores/${d.store.slug}`" target="_blank">Public page<ArrowUpRight aria-hidden="true" /></NuxtLink></Button>
          <Button v-if="d.application" as-child variant="outline" size="sm"><NuxtLink to="/admin/applications">Application</NuxtLink></Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child><Button size="sm"><MoreHorizontal aria-hidden="true" />Change status</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-52 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
              <DropdownMenuItem v-for="a in storeActions[d.store.status]" :key="a.to" :class="a.tone === 'stop' && 'text-danger'" @select="ask(a)">
                <span class="size-2 rounded-full" :style="{ background: storeStatusMeta[a.to].color }" aria-hidden="true" />{{ a.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <p v-if="d.store.status_note" class="m-0 rounded-lg bg-surface-sunk px-3.5 py-2.5 text-[13px]"><strong class="font-semibold">Last note to the store{{ d.store.status_changed_at ? ` (${adminTime(d.store.status_changed_at)})` : '' }}:</strong> {{ d.store.status_note }}</p>
      <NuxtLink v-if="d.open_reports" :to="'/admin/reports'" class="w-fit rounded-lg bg-danger/10 px-3.5 py-2 text-[13px] font-semibold text-danger no-underline ring-1 ring-danger/30">{{ d.open_reports }} open {{ d.open_reports === 1 ? 'report' : 'reports' }} on this store or its dogs →</NuxtLink>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div class="flex min-w-0 flex-col gap-5">
          <AdminCard :title="`Dogs (${d.dogs.length})`" flush>
            <ul v-if="d.dogs.length" class="m-0 flex list-none flex-col p-0">
              <li v-for="dog in d.dogs" :key="dog.id" class="flex items-center gap-3 border-t border-line px-5 py-2.5 text-[13px]">
                <img v-if="dog.photo_path" :src="dogPhotoUrl(dog.photo_path, storageUrl)" alt="" class="size-9 shrink-0 rounded-md object-cover">
                <span v-else class="size-9 shrink-0 rounded-md bg-surface-sunk" />
                <span class="flex min-w-0 flex-1 flex-col leading-tight"><strong class="font-semibold">{{ dog.name }}</strong><span class="font-mono text-[11px] text-ink-muted">{{ dog.file_no }} · {{ dog.breed }} · L{{ dog.level }}</span></span>
                <span class="inline-flex items-center gap-1.5 text-xs"><span class="size-2 rounded-full" :style="{ background: dogStatusMeta[dog.status as keyof typeof dogStatusMeta]?.color }" aria-hidden="true" />{{ dogStatusMeta[dog.status as keyof typeof dogStatusMeta]?.label }}</span>
                <span class="w-24 text-right font-mono tabular-nums">{{ formatNaira(dog.price_naira) }}</span>
              </li>
            </ul>
            <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">No dogs yet.</p>
          </AdminCard>

          <AdminCard :title="`Reviews (${d.store.reviews_count})`" :description="d.store.reviews_count ? `${Number(d.store.rating).toFixed(1)} average` : undefined" flush>
            <ul v-if="d.reviews.length" class="m-0 flex list-none flex-col p-0">
              <li v-for="r in d.reviews" :key="r.id" class="flex flex-col gap-1 border-t border-line px-5 py-3 text-[13px]">
                <span class="flex items-center gap-2"><ReviewStars :rating="r.rating" /><span class="font-semibold">{{ r.author_name || 'A buyer' }}</span><span class="ml-auto font-mono text-[11px] text-ink-muted">{{ adminTime(r.created_at) }}</span></span>
                <span class="line-clamp-2 text-ink-muted">{{ r.body }}</span>
                <span v-if="!r.store_reply" class="text-[12px] text-ink-muted">No reply yet</span>
              </li>
            </ul>
            <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">No real reviews yet.</p>
          </AdminCard>

          <AdminCard :title="`Kennel visits (${visitTotal})`" :description="Object.entries(d.visits.by_status).map(([s, n]) => `${n} ${s}`).join(' · ') || undefined" flush>
            <ul v-if="d.visits.recent.length" class="m-0 flex list-none flex-col p-0">
              <li v-for="v in d.visits.recent" :key="v.id" class="flex items-center gap-3 border-t border-line px-5 py-2.5 text-[13px]">
                <span class="w-28 shrink-0 font-mono text-[12px]">{{ visitDay(v.day).label }} · {{ v.slot }}</span>
                <span class="flex-1">{{ v.buyer_name || 'A buyer' }}</span>
                <span class="text-xs text-ink-muted">{{ v.status }}</span>
              </li>
            </ul>
            <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">No visits yet.</p>
          </AdminCard>

          <AdminCard title="History" description="Admin actions on this store and its dogs" flush>
            <div class="border-t border-line"><AdminAuditList :entries="d.audit" /></div>
          </AdminCard>
        </div>

        <div class="flex min-w-0 flex-col gap-5">
          <AdminCard :title="`Team (${d.team.length})`" flush>
            <ul class="m-0 flex list-none flex-col p-0">
              <li v-for="m in d.team" :key="m.id" class="border-t border-line">
                <NuxtLink :to="`/admin/people/${m.id}`" class="flex items-center gap-3 px-5 py-2.5 text-[13px] text-ink no-underline hover:bg-surface-sunk/60">
                  <span class="grid size-8 shrink-0 place-items-center rounded-full bg-surface-sunk text-[11px] font-bold">{{ initialsOf(m.name) }}</span>
                  <span class="flex min-w-0 flex-1 flex-col leading-tight">
                    <span class="flex items-center gap-1.5 font-semibold">{{ m.name }}<Ban v-if="m.blocked" class="size-3.5 text-danger" aria-label="Blocked" /></span>
                    <span class="truncate font-mono text-[11px] text-ink-muted">{{ m.email }}<template v-if="m.phone"> · {{ m.phone }}</template></span>
                  </span>
                  <span class="text-xs text-ink-muted">{{ storeRoles[m.role].label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </AdminCard>

          <AdminCard title="Profile">
            <div class="flex flex-col gap-2 text-[13px] leading-[19px]">
              <span v-if="d.store.tagline" class="font-semibold">"{{ d.store.tagline }}"</span>
              <span v-if="d.store.about" class="line-clamp-5 text-ink-muted">{{ d.store.about }}</span>
              <span class="text-ink-muted">Run by {{ d.store.owner_profile?.name || '—' }}<template v-if="d.store.owner_profile?.title">, {{ d.store.owner_profile.title }}</template><template v-if="d.store.founded"> · since {{ d.store.founded }}</template></span>
              <span v-if="d.store.inspection?.status === 'passed'" class="text-ink-muted">Inspected {{ d.store.inspection.date }} · {{ d.store.inspection.by }}</span>
              <span v-if="d.store.visits_paused" class="font-semibold text-danger">Visit requests paused{{ d.store.pause_note ? `: ${d.store.pause_note}` : '' }}</span>
            </div>
          </AdminCard>

          <AdminCard v-if="d.application" title="Application">
            <div class="flex flex-col gap-1.5 text-[13px]">
              <span>{{ d.application.address }}</span>
              <span class="text-ink-muted">{{ d.application.contact_phone }} · {{ d.application.preferred_days.map(x => visitDay(x).label).join(', ') || 'no days chosen' }}</span>
              <span class="text-ink-muted">ID {{ d.application.id_doc_path ? '✓' : '—' }} · CAC {{ d.application.cac_doc_path ? '✓' : d.application.cac_registered ? '—' : 'not registered' }}</span>
              <span class="text-ink-muted">{{ d.application.submitted_at ? `Sent ${adminTime(d.application.submitted_at)}` : 'Not sent yet' }}</span>
            </div>
          </AdminCard>

          <AdminCard :title="`Inspections (${d.inspections.length})`" flush>
            <ul v-if="d.inspections.length" class="m-0 flex list-none flex-col p-0">
              <li v-for="i in d.inspections" :key="i.id" class="border-t border-line">
                <NuxtLink :to="`/admin/inspections/${i.id}`" class="flex items-center gap-2 px-5 py-2.5 text-[13px] text-ink no-underline hover:bg-surface-sunk/60">
                  <span class="size-2 rounded-full" :style="{ background: inspectionStatusMeta[i.status].color }" aria-hidden="true" />
                  <span class="flex-1">{{ inspectionWhen(i.scheduled_for) }}</span>
                  <span class="text-xs text-ink-muted">{{ inspectionStatusMeta[i.status].label }} · {{ i.inspector }}</span>
                </NuxtLink>
              </li>
            </ul>
            <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">None yet.</p>
          </AdminCard>

          <AdminCard title="Also">
            <ul class="m-0 flex list-none flex-col gap-1 p-0 text-[13px] text-ink-muted">
              <li>{{ d.conversations }} conversations with buyers</li>
              <li>{{ d.care }} providers on its care team</li>
            </ul>
          </AdminCard>
        </div>
      </div>

      <AdminConfirm
        v-if="pending"
        v-model:open="confirmOpen"
        :title="`${pending.label}: ${d.store.name}`"
        :description="`${storeStatusMeta[d.store.status].label} → ${storeStatusMeta[pending.to].label}. ${storeActionEffect[pending.to]}`"
        :confirm-label="pending.label"
        :reason-required="pending.reason"
        reason-for="the store"
        :danger="pending.to !== 'verified'"
        :run="run"
      />
    </template>
  </div>
</template>
