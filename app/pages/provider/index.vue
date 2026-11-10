<script setup lang="ts">
import { CalendarCheck, Download, LayoutList, Search, Table2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { definePageMeta, useCookie, useSeoMeta } from '#imports' // nuxt
import type { ProviderBooking } from '~/composables/useProviderDashboard'
import type { BookingPeriod, BookingSort, BookingStatusFilter } from '~/utils/providerBookings'
import { useNotify } from '~/composables/useNotify'
import { useProviderDashboard } from '~/composables/useProviderDashboard'
import { downloadCsv } from '~/utils/csv'
import { bookingCsv, bookingPeriods, bookingSorts, bookingStatusFilters, filterBookings, inPeriod, inStatus, periodLabel, periodRange } from '~/utils/providerBookings'
import { visitDay } from '~/utils/time'

// Provider dashboard › Bookings: this month's work by default, one status at a time (with counts) and a search, in an order,
// as a list or a table (the choice is remembered). Every booking opens in full in a dialog, where it's
// answered, marked done, or added to the dog's record (when the owner allowed it). The rows shown download
// as a CSV.
definePageMeta({ title: 'Bookings' })
useSeoMeta({ title: 'Bookings · Provider dashboard · Dogeash', robots: 'noindex' })

const dash = useProviderDashboard()
const { bookings, requests, loaded } = dash
const notify = useNotify()

const period = ref<BookingPeriod>('this-month')
const status = ref<BookingStatusFilter>('all')
const query = ref('')
const sort = ref<BookingSort>('soonest')
const view = useCookie<'list' | 'table'>('dogeash-provider-view', { default: () => 'list', maxAge: 60 * 60 * 24 * 365 })
const viewModel = computed({ get: () => view.value, set: (v) => { if (v) view.value = v } })

const shown = computed(() => filterBookings(bookings.value, { period: period.value, status: status.value, query: query.value, sort: sort.value }))
// Requests waiting outside the period still get a nudge
const waitingElsewhere = computed(() => {
  const r = periodRange(period.value)
  return r ? requests.value.filter(b => b.day < r.from || b.day > r.to).length : 0
})
// Each status with how many of the period's bookings it has
const tabs = computed(() => {
  const list = inPeriod(bookings.value, period.value)
  return bookingStatusFilters.map(f => ({ ...f, count: list.filter(b => inStatus(b, f.value)).length }))
})
const statusModel = computed({ get: () => status.value, set: (v) => { if (v) status.value = v } })
const filtered = computed(() => status.value !== 'all' || query.value.trim() !== '')
function clearFilters() {
  status.value = 'all'
  query.value = ''
}
function showWaiting() {
  period.value = 'all'
  status.value = 'requested'
}

function download() {
  if (!shown.value.length) return notify.failed('Nothing to download for these filters.')
  downloadCsv(`bookings-${period.value}`, shown.value, bookingCsv)
}

// The booking open in the details dialog (kept in sync with the list after an action)
const openId = ref<string>()
const detailOpen = ref(false)
const opened = computed(() => bookings.value.find(b => b.id === openId.value))
function openDetail(b: ProviderBooking) {
  openId.value = b.id
  detailOpen.value = true
}

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
const field = 'h-10! border-line-strong bg-surface'
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- One panel: the period and download, the statuses (one at a time, with counts), then search, order, view -->
    <section class="overflow-hidden rounded-xl bg-surface ring-1 ring-line" aria-labelledby="period-title">
      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4 sm:px-5">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">Your bookings</span>
          <h2 id="period-title" class="m-0 font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">{{ periodLabel(period) }}</h2>
        </div>
        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SelectMenu v-model="period" :options="bookingPeriods" aria-label="Period" :class="[field, 'min-w-0 flex-1 sm:w-[170px] sm:flex-none']" />
          <Button variant="outline" size="sm" class="h-10 border-line-strong" @click="download"><Download aria-hidden="true" />CSV</Button>
        </div>
      </div>

      <!-- Statuses: tabs, so only one is ever chosen -->
      <ToggleGroup v-model="statusModel" type="single" aria-label="Status" class="flex w-full justify-start gap-0 overflow-x-auto border-y border-line px-2 [scrollbar-width:none] sm:px-3">
        <ToggleGroupItem
          v-for="t in tabs"
          :key="t.value"
          :value="t.value"
          class="relative h-11 shrink-0 gap-2 rounded-none border-0 bg-transparent! px-3 text-sm font-semibold whitespace-nowrap text-ink-muted shadow-none hover:text-ink data-[state=on]:text-ink data-[state=on]:after:absolute data-[state=on]:after:inset-x-3 data-[state=on]:after:bottom-0 data-[state=on]:after:h-[3px] data-[state=on]:after:rounded-t-full data-[state=on]:after:bg-marigold"
        >
          {{ t.label }}
          <span :class="['grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-mono text-[10.5px] font-bold', t.value === 'requested' && t.count ? 'bg-marigold text-on-marigold' : 'bg-surface-sunk text-ink-muted']">{{ t.count }}</span>
        </ToggleGroupItem>
      </ToggleGroup>

      <div class="flex flex-wrap items-center gap-2 bg-canvas/40 p-3 sm:px-5">
        <InputGroup class="h-10 min-w-[200px] flex-[1_1_240px] border-line-strong bg-surface">
          <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput v-model="query" type="search" placeholder="Buyer, dog, service or phone" aria-label="Search bookings" />
        </InputGroup>
        <SelectMenu v-model="sort" :options="bookingSorts" aria-label="Order" :class="[field, 'min-w-0 flex-[1_1_180px] sm:w-[210px] sm:flex-none']" />
        <ToggleGroup v-model="viewModel" type="single" variant="outline" aria-label="View" class="h-10 shrink-0">
          <ToggleGroupItem value="list" aria-label="List" class="h-10 px-3"><LayoutList aria-hidden="true" /><span class="max-sm:sr-only">List</span></ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table" class="h-10 px-3"><Table2 aria-hidden="true" /><span class="max-sm:sr-only">Table</span></ToggleGroupItem>
        </ToggleGroup>
      </div>
    </section>

    <button v-if="waitingElsewhere" type="button" class="-mt-2 flex w-fit cursor-pointer items-center gap-2 rounded-full border-0 bg-marigold-soft px-3 py-1.5 text-[13px] font-semibold text-ink hover:brightness-95" @click="showWaiting">
      <span class="size-1.5 rounded-full bg-marigold" aria-hidden="true" />{{ waitingElsewhere }} more {{ waitingElsewhere === 1 ? 'request' : 'requests' }} to answer outside {{ periodLabel(period) }} · Show
    </button>
    <span class="sr-only" aria-live="polite">{{ shown.length }} {{ shown.length === 1 ? 'booking' : 'bookings' }}</span>

    <ListSkeleton v-if="!loaded" :rows="3" :variant="view === 'table' ? 'table' : undefined" label="Loading your bookings" />

    <template v-else-if="shown.length">
      <ProviderBookingsTable v-if="view === 'table'" :bookings="shown" @open="openDetail" />
      <div v-else class="flex flex-col gap-3">
        <CareBookingCard
          v-for="b in shown"
          :key="b.id"
          side="provider"
          :muted="b.status === 'declined' || b.status === 'cancelled'"
          :service="b.service" :day="b.day" :slot="b.slot" :place="b.place" :status="b.status"
          :who="b.buyerName" :phone="b.buyerPhone" :dog-name="b.dogName" :shared="b.canAddRecord" :note="b.note" :provider-note="b.providerNote"
        >
          <ProviderBookingActions :booking="b" :confirming="confirming === b.id" @confirm="confirm(b)" @decline="startAnswer(b, 'declined')" @done="startAnswer(b, 'done')" @record="startRecord(b)" />
          <Button variant="ghost" size="sm" @click="openDetail(b)">Details</Button>
        </CareBookingCard>
      </div>
    </template>

    <div v-else class="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-12 text-center ring-1 ring-line">
      <span class="grid size-12 place-items-center rounded-full bg-marigold-soft"><CalendarCheck class="size-5" aria-hidden="true" /></span>
      <p class="m-0 max-w-[32em] text-[15px] leading-6 text-ink-muted">
        <template v-if="filtered">No bookings match these filters in {{ periodLabel(period) }}.</template>
        <template v-else>No bookings in {{ periodLabel(period) }}. Buyers book from your page on Dogeash; you'll get a notification for each one.</template>
      </p>
      <Button v-if="filtered" variant="outline" size="sm" @click="clearFilters">Clear filters</Button>
      <Button v-else-if="period !== 'all'" variant="outline" size="sm" @click="period = 'all'">Show everything</Button>
    </div>

    <ProviderBookingDetail
      v-if="opened"
      v-model:open="detailOpen"
      :booking="opened"
      :confirming="confirming === opened.id"
      @confirm="confirm(opened)"
      @decline="detailOpen = false; startAnswer(opened, 'declined')"
      @done="detailOpen = false; startAnswer(opened, 'done')"
      @record="detailOpen = false; startRecord(opened)"
    />
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
