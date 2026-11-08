<script setup lang="ts">
import { BookMarked, CalendarCheck } from '@lucide/vue'
import { ref } from 'vue'
import { useSeoMeta } from '#imports' // nuxt
import type { ProviderBooking } from '~/composables/useProviderDashboard'
import { useNotify } from '~/composables/useNotify'
import { useProviderDashboard } from '~/composables/useProviderDashboard'
import { visitDay } from '~/utils/time'

// Provider dashboard › Bookings: requests to answer, appointments coming up, and earlier ones. When the
// owner allowed it, the provider adds what they did (a vaccination, a treatment, the next due date) to the
// dog's record; they see only the lines they added.
useSeoMeta({ title: 'Bookings · Provider dashboard · Dogeash', robots: 'noindex' })

const dash = useProviderDashboard()
const { requests, comingUp, earlier, loaded } = dash
const notify = useNotify()

// Answering with a note (declining, marking done): the buyer reads it
const answering = ref<{ b: ProviderBooking, to: 'declined' | 'done' }>()
const answerOpen = ref(false)
function startAnswer(b: ProviderBooking, to: 'declined' | 'done') {
  answering.value = { b, to }
  answerOpen.value = true
}
async function answer(note: string) {
  const a = answering.value!
  const error = await dash.setStatus(a.b.id, a.to, note)
  if (!error) notify.visitUpdated(a.to === 'done' ? 'Marked done' : 'Booking declined', `${a.b.buyerName} has been told.`)
  return error
}
const confirming = ref('')
async function confirm(b: ProviderBooking) {
  confirming.value = b.id
  const error = await dash.setStatus(b.id, 'confirmed')
  confirming.value = ''
  if (error) notify.failed(error)
  else notify.visitUpdated('Booking confirmed', `${b.buyerName} · ${visitDay(b.day).label}, ${b.slot}. They've been told.`)
}

// Adding to the dog's record
const recording = ref<ProviderBooking>()
const recordOpen = ref(false)
function startRecord(b: ProviderBooking) {
  recording.value = b
  recordOpen.value = true
}
async function saveRecord(r: { kind: Parameters<typeof dash.addRecord>[1]['kind'], title: string, doneOn: string | null, dueOn: string | null, note: string }) {
  const b = recording.value!
  const error = await dash.addRecord(b.id, { kind: r.kind, title: r.title, doneOn: r.doneOn, dueOn: r.dueOn, note: r.note })
  if (!error) notify.visitUpdated(`Added to ${b.dogName}'s record`, `${r.title}. ${b.buyerName} has been told.`)
  return error
}
const isPast = (b: ProviderBooking) => b.day < new Date().toISOString().slice(0, 10)
</script>

<template>
  <div class="flex flex-col gap-8">
    <section class="flex flex-col gap-3" aria-labelledby="requests">
      <h2 id="requests" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">To answer · {{ requests.length }}</h2>
      <ListSkeleton v-if="!loaded" :rows="2" label="Loading your bookings" />
      <CareBookingCard
        v-for="b in requests"
        :key="b.id"
        side="provider"
        :service="b.service" :day="b.day" :slot="b.slot" :place="b.place" :status="b.status"
        :who="b.buyerName" :phone="b.buyerPhone" :dog-name="b.dogName" :shared="b.canAddRecord" :note="b.note"
      >
        <Button variant="marigold" size="sm" :loading="confirming === b.id" @click="confirm(b)">Confirm</Button>
        <Button variant="outline" size="sm" @click="startAnswer(b, 'declined')">Can't make it</Button>
      </CareBookingCard>
      <div v-if="loaded && !requests.length" class="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-10 text-center ring-1 ring-line">
        <span class="grid size-12 place-items-center rounded-full bg-marigold-soft"><CalendarCheck class="size-5" aria-hidden="true" /></span>
        <p class="m-0 max-w-[30em] text-[15px] leading-6 text-ink-muted">No requests waiting. Buyers book from your page on Dogeash; you'll get a notification for each one.</p>
      </div>
    </section>

    <section v-if="comingUp.length" class="flex flex-col gap-3" aria-labelledby="coming-up">
      <h2 id="coming-up" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">Coming up · {{ comingUp.length }}</h2>
      <CareBookingCard
        v-for="b in comingUp"
        :key="b.id"
        side="provider"
        :service="b.service" :day="b.day" :slot="b.slot" :place="b.place" :status="b.status"
        :who="b.buyerName" :phone="b.buyerPhone" :dog-name="b.dogName" :shared="b.canAddRecord" :note="b.note" :provider-note="b.providerNote"
      >
        <Button variant="outline" size="sm" @click="startAnswer(b, 'done')">Mark done</Button>
        <Button v-if="b.canAddRecord" variant="outline" size="sm" @click="startRecord(b)"><BookMarked aria-hidden="true" />Add to {{ b.dogName }}'s record</Button>
      </CareBookingCard>
    </section>

    <section v-if="earlier.length" class="flex flex-col gap-3" aria-labelledby="earlier">
      <h2 id="earlier" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">Earlier · {{ earlier.length }}</h2>
      <CareBookingCard
        v-for="b in earlier"
        :key="b.id"
        side="provider"
        :muted="b.status !== 'confirmed'"
        :service="b.service" :day="b.day" :slot="b.slot" :place="b.place" :status="b.status"
        :who="b.buyerName" :phone="b.buyerPhone" :dog-name="b.dogName" :shared="b.canAddRecord && (b.status === 'confirmed' || b.status === 'done')" :provider-note="b.providerNote"
      >
        <Button v-if="b.status === 'confirmed' && isPast(b)" variant="marigold" size="sm" @click="startAnswer(b, 'done')">Mark done</Button>
        <Button v-if="b.canAddRecord && (b.status === 'confirmed' || b.status === 'done')" variant="outline" size="sm" @click="startRecord(b)"><BookMarked aria-hidden="true" />Add to {{ b.dogName }}'s record</Button>
        <span v-if="b.recordsAdded" class="self-center text-[13px] text-ink-muted">{{ b.recordsAdded }} {{ b.recordsAdded === 1 ? 'line' : 'lines' }} added</span>
      </CareBookingCard>
    </section>

    <AdminConfirm
      v-if="answering"
      v-model:open="answerOpen"
      :title="answering.to === 'done' ? `Mark ${answering.b.service.toLowerCase()} done?` : `Decline ${answering.b.buyerName}'s booking?`"
      :description="answering.to === 'done' ? 'The buyer is told it\'s done. Anything to tell them, like when to come back?' : 'They\'re told straight away and can book another time. Say why, or suggest another day.'"
      :confirm-label="answering.to === 'done' ? 'Mark done' : 'Decline'"
      :reason-required="answering.to === 'declined'"
      reason-for="the buyer"
      :run="answer"
    />
    <AccountDogRecordDialog
      v-if="recording"
      v-model:open="recordOpen"
      :dog-name="recording.dogName"
      hide-by
      :save="r => saveRecord(r)"
    />
  </div>
</template>
