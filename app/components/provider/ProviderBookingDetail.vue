<script setup lang="ts">
import { computed } from 'vue'
import type { DetailSection } from '~/components/DetailDialog.vue'
import type { ProviderBooking } from '~/composables/useProviderDashboard'
import { careBookingStatus } from '~/composables/useCareBookings'
import { shortTime, visitDay } from '~/utils/time'

// One booking in full, from the list or the table: the appointment, the buyer, the dog and the notes, with
// what the provider can do now along the bottom.
const props = defineProps<{ booking: ProviderBooking, confirming?: boolean }>()
const emit = defineEmits<{ confirm: [], decline: [], done: [], record: [] }>()
const open = defineModel<boolean>('open', { default: false })

const sections = computed<DetailSection[]>(() => {
  const b = props.booking
  return [
    { title: 'Appointment', rows: [
      { label: 'Services', value: b.service, long: true },
      { label: 'Day', value: visitDay(b.day).label },
      { label: 'Time', value: b.slot, mono: true },
      { label: 'Where', value: b.place === 'home' ? 'At the buyer\'s home' : 'At your premises' },
      { label: 'Status', value: careBookingStatus[b.status].label },
    ] },
    { title: 'Buyer', rows: [
      { label: 'Name', value: b.buyerName },
      { label: 'Phone', value: b.buyerPhone ?? (b.status === 'requested' || b.status === 'confirmed' ? 'Not given' : 'Hidden once it\'s closed') },
      { label: 'Requested', value: shortTime(b.createdAt) },
    ] },
    { title: 'Dog', rows: [
      { label: 'Name', value: b.dogName || 'Not given' },
      { label: 'Its record', value: b.canAddRecord ? 'The owner lets you add this visit' : 'Not shared with you' },
      { label: 'Lines you added', value: b.canAddRecord ? b.recordsAdded : null },
    ] },
    { title: 'Notes', rows: [
      { label: 'From the buyer', value: b.note, long: true },
      { label: 'Your note to them', value: b.providerNote, long: true },
    ] },
  ]
})
</script>

<template>
  <DetailDialog v-model:open="open" :title="props.booking.service" :subtitle="`${props.booking.buyerName} · ${visitDay(props.booking.day).label}, ${props.booking.slot}`" :sections="sections">
    <template #actions>
      <ProviderBookingActions :booking="props.booking" :confirming="props.confirming" @confirm="emit('confirm')" @decline="emit('decline')" @done="emit('done')" @record="emit('record')" />
    </template>
  </DetailDialog>
</template>
