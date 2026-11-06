<script setup lang="ts">
import { CalendarClock, FileText, MapPin, Phone } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { AdminApplication } from '~/utils/admin'
import type { CsvColumn } from '~/utils/csv'
import { useAdminApplications } from '~/composables/useAdminApplications'
import { useAdminInspections } from '~/composables/useAdminInspections'
import { useNotify } from '~/composables/useNotify'
import { adminTime } from '~/utils/admin'
import { visitDay } from '~/utils/time'
import { inspectionStatusMeta, inspectionWhen } from '~/utils/inspections'

// Admin › Applications: stores asking to go live, with everything needed to decide: the owner, the profile,
// the kennel's address and preferred inspection days, and the documents (private; they open for a minute).
// Approve (the store goes live and its inspection is recorded) or send back with a reason the owner reads.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Applications · Dogeash admin', robots: 'noindex' })

const { applications, loaded, load, openDoc, decide } = useAdminApplications()
const inspections = useAdminInspections()
onMounted(() => Promise.all([load(), inspections.load(), inspections.loadStaff()]))

// The latest inspection of each store, to show beside its application
const inspectionOf = (a: AdminApplication) => inspections.list.value.find(i => i.store_id === a.public_id)
const booking = ref<AdminApplication>()
const bookingOpen = ref(false)
function book(a: AdminApplication) {
  booking.value = a
  bookingOpen.value = true
}
async function onBook(day: string, time: string, inspector: string, note: string) {
  const error = await inspections.schedule(booking.value!.public_id, day, time, inspector, note)
  if (!error) useNotify().adminDone(`Inspection booked: ${booking.value!.name}`, 'The owner and the inspector have been told.')
  return error
}

const tab = ref<'in_review' | 'draft'>('in_review')
const tabModel = computed({ get: () => tab.value, set: (v: string) => { if (v) tab.value = v as 'in_review' | 'draft' } })
const shown = computed(() => applications.value.filter(a => a.status === tab.value))
const countOf = (s: 'in_review' | 'draft') => applications.value.filter(a => a.status === s).length
const csv: CsvColumn<AdminApplication>[] = [
  { label: 'Store ID', value: a => a.public_id }, { label: 'Store', value: a => a.name }, { label: 'City', value: a => a.city }, { label: 'Status', value: a => a.status },
  { label: 'Owner', value: a => a.owner?.name }, { label: 'Owner email', value: a => a.owner?.email }, { label: 'Owner phone', value: a => a.owner?.phone },
  { label: 'Address', value: a => a.address }, { label: 'Inspector phone', value: a => a.contact_phone }, { label: 'Preferred days', value: a => a.preferred_days.join('; ') },
  { label: 'Dogs', value: a => a.dogs }, { label: 'ID uploaded', value: a => !!a.id_doc_path }, { label: 'CAC', value: a => a.cac_doc_path ? 'uploaded' : a.cac_registered ? 'missing' : 'not registered' },
  { label: 'Sent', value: a => a.submitted_at },
]

const docs = (a: AdminApplication) => [
  { label: 'Owner\'s ID', path: a.id_doc_path, missing: 'Missing' },
  { label: 'CAC certificate', path: a.cac_doc_path, missing: a.cac_registered ? 'Missing' : 'Not registered yet' },
  { label: 'Proof of address', path: a.address_doc_path, missing: 'Not given' },
]

const pending = ref<{ app: AdminApplication, approve: boolean }>()
const confirmOpen = ref(false)
function ask(app: AdminApplication, approve: boolean) {
  pending.value = { app, approve }
  confirmOpen.value = true
}
async function run(note: string) {
  const { app, approve } = pending.value!
  const error = await decide(app, approve, note)
  if (!error) useNotify().adminDone(approve ? `${app.name} approved` : `${app.name} sent back`, approve ? 'The store is live, and its inspection is recorded. The owner has been told.' : 'The owner can change the application and send it again.')
  return error
}
</script>

<template>
  <AdminPage title="Applications" :count="countOf('in_review')" description="Stores asking to go live. Check the documents, book the inspection (passing it approves the store), or send it back.">
    <template #actions>
      <AdminExport name="applications" :rows="shown" :columns="csv" />
      <ToggleGroup v-model="tabModel" type="single" variant="outline" size="sm" aria-label="Show applications" class="max-w-full flex-wrap justify-start">
        <ToggleGroupItem value="in_review" class="px-2.5 text-xs">Waiting <span class="ml-1 font-mono text-ink-muted">{{ countOf('in_review') }}</span></ToggleGroupItem>
        <ToggleGroupItem value="draft" class="px-2.5 text-xs">Sent back <span class="ml-1 font-mono text-ink-muted">{{ countOf('draft') }}</span></ToggleGroupItem>
      </ToggleGroup>
    </template>

    <div v-if="shown.length" class="flex flex-col gap-4">
      <AdminCard v-for="a in shown" :key="a.public_id" :title="a.name" :description="`${a.public_id} · ${[...new Set([a.area, a.city, a.state].filter(Boolean))].join(', ')} · ${a.submitted_at ? `sent ${adminTime(a.submitted_at)}` : 'no form'}`">
        <template #actions>
          <Button as-child variant="ghost" size="sm"><NuxtLink :to="`/admin/stores/${a.public_id}`">Store page</NuxtLink></Button>
          <template v-if="a.status === 'in_review'">
            <Button variant="outline" size="sm" @click="ask(a, false)">Send back</Button>
            <Button v-if="inspectionOf(a)?.status !== 'scheduled'" variant="marigold" size="sm" @click="book(a)"><CalendarClock aria-hidden="true" />Book inspection</Button>
            <Button variant="ghost" size="sm" title="Approve without an inspection record" @click="ask(a, true)">Approve now</Button>
          </template>
        </template>

        <NuxtLink v-if="inspectionOf(a)" :to="`/admin/inspections/${inspectionOf(a)!.id}`" class="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-surface-sunk px-3.5 py-2.5 text-[13px] text-ink no-underline hover:ring-1 hover:ring-line-strong">
          <span class="size-2 rounded-full" :style="{ background: inspectionStatusMeta[inspectionOf(a)!.status].color }" aria-hidden="true" />
          <strong class="font-semibold">Inspection {{ inspectionStatusMeta[inspectionOf(a)!.status].label.toLowerCase() }}</strong>
          · {{ inspectionWhen(inspectionOf(a)!.scheduled_for) }} · {{ inspectionOf(a)!.inspector }}
          <span class="ml-auto font-semibold underline underline-offset-4">Open the sheet</span>
        </NuxtLink>
        <p v-if="!a.has_form" class="m-0 mb-4 rounded-lg bg-surface-sunk px-3.5 py-2.5 text-[13px]"><strong class="font-semibold">No application form:</strong> this store went to review before the form existed, so there's no address, inspection days or documents yet. Send it back to ask the owner to fill the form in, or approve it if you already know them.</p>
        <p v-if="a.status === 'draft' && a.status_note" class="m-0 mb-4 rounded-lg bg-surface-sunk px-3.5 py-2.5 text-[13px]"><strong class="font-semibold">Sent back:</strong> {{ a.status_note }} <span class="text-ink-muted">· waiting for the owner</span></p>

        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Who and what -->
          <div class="flex flex-col gap-3 text-[13px]">
            <span class="font-mono text-[10.5px] tracking-[.12em] text-ink-muted uppercase">Owner and store</span>
            <span class="flex flex-col leading-snug">
              <strong class="font-semibold">{{ a.owner?.name ?? '—' }}</strong>
              <span class="text-ink-muted">{{ a.owner?.email }}</span>
              <span class="text-ink-muted">{{ a.owner?.phone }}</span>
            </span>
            <span v-if="a.tagline" class="font-medium">"{{ a.tagline }}"</span>
            <span v-if="a.about" class="line-clamp-4 leading-[19px] text-ink-muted">{{ a.about }}</span>
            <span class="text-ink-muted">
              Run by {{ a.owner_profile?.name || '—' }}<template v-if="a.owner_profile?.title">, {{ a.owner_profile.title }}</template>
              · {{ a.dogs }} {{ a.dogs === 1 ? 'dog' : 'dogs' }} listed
            </span>
          </div>

          <!-- Where and when -->
          <div class="flex flex-col gap-3 text-[13px]">
            <span class="font-mono text-[10.5px] tracking-[.12em] text-ink-muted uppercase">Inspection</span>
            <span class="flex gap-2"><MapPin class="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" /><span class="flex flex-col leading-snug"><span>{{ a.address }}</span><span v-if="a.directions" class="text-ink-muted">{{ a.directions }}</span></span></span>
            <a :href="`tel:${a.contact_phone}`" class="flex items-center gap-2 text-ink"><Phone class="size-4 text-ink-muted" aria-hidden="true" />{{ a.contact_phone }}</a>
            <span class="flex flex-wrap gap-1.5">
              <span v-for="d in a.preferred_days" :key="d" class="rounded-full bg-marigold-soft px-2.5 py-0.5 text-xs font-semibold">{{ visitDay(d).label }}</span>
            </span>
            <span v-if="a.note" class="rounded-lg bg-surface-sunk px-3 py-2 leading-[19px]">"{{ a.note }}"</span>
          </div>

          <!-- Documents -->
          <div class="flex flex-col gap-2 text-[13px]">
            <span class="font-mono text-[10.5px] tracking-[.12em] text-ink-muted uppercase">Documents</span>
            <div v-for="d in docs(a)" :key="d.label" class="flex items-center gap-3 rounded-lg px-3 py-2 ring-1 ring-line">
              <FileText class="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span class="flex-1">{{ d.label }}</span>
              <Button v-if="d.path" variant="ghost" size="sm" class="h-7" @click="openDoc(d.path)">Open</Button>
              <span v-else class="text-xs text-ink-muted">{{ d.missing }}</span>
            </div>
          </div>
        </div>
      </AdminCard>
    </div>
    <p v-else class="m-0 text-sm text-ink-muted">{{ !loaded ? 'Loading…' : tab === 'in_review' ? 'No applications waiting.' : 'No applications sent back.' }}</p>

    <AdminScheduleInspection
      v-if="booking"
      v-model:open="bookingOpen"
      :store-name="booking.name"
      :preferred-days="booking.preferred_days"
      :staff="inspections.staff.value"
      :book="onBook"
    />
    <AdminConfirm
      v-if="pending"
      v-model:open="confirmOpen"
      :title="pending.approve ? `Approve ${pending.app.name}?` : `Send ${pending.app.name} back?`"
      :description="pending.approve
        ? 'Approves without an inspection sheet: the store and its live dogs show to buyers, and its page shows it as inspected this month. Use this only when the inspection was done outside Dogeash.'
        : 'The store goes back to its owner as a draft, with your reason. They can change the application and send it again.'"
      :confirm-label="pending.approve ? 'Approve' : 'Send back'"
      :reason-required="!pending.approve"
      reason-for="the owner"
      :danger="!pending.approve"
      :run="run"
    />
  </AdminPage>
</template>
