<script setup lang="ts">
import { BellRing, CalendarClock } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { Reinspection } from '~/composables/useAdminReinspections'
import { useAdminInspections } from '~/composables/useAdminInspections'
import { useAdminReinspections } from '~/composables/useAdminReinspections'
import { useNotify } from '~/composables/useNotify'
import { inspectionWhen } from '~/utils/inspections'
import { visitDay } from '~/utils/time'

// Admin › Re-inspections: every verified store by when its year of verification runs out. Overdue first, then
// due within 30 days, then later. Book the re-inspection from here; passing it starts a fresh year.
// Reminders go to stores 30 days before (daily where pg_cron runs; "Send reminders now" any time).
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Re-inspections · Dogeash admin', robots: 'noindex' })

const { stores, loaded, load, remind } = useAdminReinspections()
const inspections = useAdminInspections()
onMounted(() => Promise.all([load(), inspections.loadStaff()]))

const today = new Date().toISOString().slice(0, 10)
const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
const groups = computed(() => [
  { key: 'overdue', title: 'Overdue', hint: 'Their year has run out. Book a visit, or suspend them in Stores.', rows: stores.value.filter(s => !s.verified_until || s.verified_until < today) },
  { key: 'soon', title: 'Due within 30 days', hint: 'Reminded 30 days before. Book them now.', rows: stores.value.filter(s => s.verified_until && s.verified_until >= today && s.verified_until <= in30) },
  { key: 'later', title: 'Later', hint: '', rows: stores.value.filter(s => s.verified_until && s.verified_until > in30) },
])
const daysLeft = (d: string) => Math.round((new Date(`${d}T12:00:00`).getTime() - Date.now()) / 864e5)

const reminding = ref(false)
async function sendNow() {
  reminding.value = true
  const n = await remind()
  reminding.value = false
  if (n === null) return useNotify().failed('That didn\'t work. Try again.')
  useNotify().adminDone(n ? `${n} ${n === 1 ? 'store' : 'stores'} reminded` : 'No one to remind', n ? 'Their owners and managers have it in their bell.' : 'Every store due soon was already reminded.')
}

const booking = ref<Reinspection>()
const bookingOpen = ref(false)
function book(s: Reinspection) {
  booking.value = s
  bookingOpen.value = true
}
async function onBook(day: string, time: string, inspector: string, note: string) {
  const error = await inspections.schedule(booking.value!.public_id, day, time, inspector, note)
  if (!error) {
    useNotify().adminDone(`Re-inspection booked: ${booking.value!.name}`, 'The store and the inspector have been told.')
    await load()
  }
  return error
}
</script>

<template>
  <AdminPage title="Re-inspections" :count="groups[0]!.rows.length + groups[1]!.rows.length" description="Stores stay verified for a year after their inspection. Book the next one before it runs out.">
    <template #actions>
      <Button variant="outline" size="sm" :loading="reminding" @click="sendNow"><BellRing aria-hidden="true" />Send reminders now</Button>
    </template>

    <p v-if="!loaded" class="m-0 text-sm text-ink-muted">Loading…</p>
    <template v-else>
      <AdminCard v-for="g in groups" :key="g.key" :title="`${g.title} (${g.rows.length})`" :description="g.hint || undefined" flush>
        <ul v-if="g.rows.length" class="m-0 flex list-none flex-col p-0">
          <li v-for="s in g.rows" :key="s.public_id" class="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line px-5 py-3">
            <span class="flex min-w-[12rem] flex-1 flex-col leading-tight">
              <NuxtLink :to="`/admin/stores/${s.public_id}`" class="text-[14px] font-semibold text-ink hover:underline">{{ s.name }}</NuxtLink>
              <span class="font-mono text-[11px] text-ink-muted">{{ s.public_id }} · {{ s.city }}<template v-if="s.last_inspected"> · last inspected {{ s.last_inspected }}</template></span>
            </span>
            <span :class="['font-mono text-[12.5px]', g.key === 'overdue' ? 'font-semibold text-danger' : g.key === 'soon' ? 'font-semibold' : 'text-ink-muted']">
              {{ s.verified_until ? `${g.key === 'overdue' ? 'ran out' : 'until'} ${visitDay(s.verified_until).label}` : 'no date' }}<template v-if="s.verified_until && g.key !== 'later'"> · {{ Math.abs(daysLeft(s.verified_until)) }} days {{ g.key === 'overdue' ? 'ago' : 'left' }}</template>
            </span>
            <NuxtLink v-if="s.booked" :to="`/admin/inspections/${s.booked.id}`" class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink"><CalendarClock class="size-4" aria-hidden="true" />Booked {{ inspectionWhen(s.booked.scheduled_for) }}</NuxtLink>
            <Button v-else :variant="g.key === 'later' ? 'ghost' : 'marigold'" size="sm" @click="book(s)">Book re-inspection</Button>
          </li>
        </ul>
        <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">None.</p>
      </AdminCard>
    </template>

    <AdminScheduleInspection v-if="booking" v-model:open="bookingOpen" :store-name="booking.name" :preferred-days="[]" :staff="inspections.staff.value" :book="onBook" />
  </AdminPage>
</template>
