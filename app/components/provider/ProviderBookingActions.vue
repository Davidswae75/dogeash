<script setup lang="ts">
import { BookMarked } from '@lucide/vue'
import type { ProviderBooking } from '~/composables/useProviderDashboard'
import { canAddToRecord, canMarkDone } from '~/utils/providerBookings'
import { todayIso } from '~/utils/time'

// What the provider can do with a booking right now, for the list, the details dialog and anywhere else:
// answer a request (Confirm / Can't make it), mark it done (on the day or after), add to the dog's record.
const props = defineProps<{ booking: ProviderBooking, confirming?: boolean }>()
const emit = defineEmits<{ confirm: [], decline: [], done: [], record: [] }>()
</script>

<template>
  <template v-if="props.booking.status === 'requested'">
    <Button variant="marigold" size="sm" :loading="props.confirming" @click="emit('confirm')">Confirm</Button>
    <Button variant="outline" size="sm" @click="emit('decline')">Can't make it</Button>
  </template>
  <Button v-if="canMarkDone(props.booking)" :variant="props.booking.day < todayIso() ? 'marigold' : 'outline'" size="sm" @click="emit('done')">Mark done</Button>
  <Button v-if="canAddToRecord(props.booking)" variant="outline" size="sm" @click="emit('record')"><BookMarked aria-hidden="true" />Add to {{ props.booking.dogName || 'the dog' }}'s record</Button>
</template>
