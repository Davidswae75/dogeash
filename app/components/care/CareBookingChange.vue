<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BookingRequestValues } from '~/components/BookingDialog.vue'
import type { CareBooking } from '~/composables/useCareBookings'
import { useCareBookings } from '~/composables/useCareBookings'
import { careTypes, findCareProvider, providerServices } from '~/utils/care'
import { todayIso } from '~/utils/time'

// Change a care booking the provider hasn't answered yet: the same dialog as booking, starting from the
// booking as it is (services, day, time, place). Once the provider confirms or declines, it's fixed, so the
// buyer's bookings page only shows this while it's waiting.
const props = defineProps<{ booking: CareBooking }>()
const provider = computed(() => findCareProvider(props.booking.providerId))
const bookings = useCareBookings()
const full = ref<string[]>([])
const loadFull = async () => { full.value = await bookings.fullSlots(props.booking.providerId) }
const send = (b: BookingRequestValues) => bookings.edit(props.booking.id, { services: b.services, day: b.day, slot: b.slot, place: b.place })
</script>

<template>
  <BookingDialog
    v-if="provider && props.booking.status === 'requested' && props.booking.day > todayIso()"
    :title="provider.name"
    :description="`${careTypes[provider.type].label} · Change your booking until they answer it`"
    :services="providerServices(provider)"
    :full-slots="full"
    :load-full-slots="loadFull"
    :home-visits="provider.homeVisits"
    :weekdays="provider.weekdays"
    :slots="provider.slots"
    :initial="{ services: props.booking.services, day: props.booking.day, slot: props.booking.slot, place: props.booking.place }"
    :send="send"
    multiple-services
    trigger-label="Change"
    submit-label="Save the change"
    plain-trigger
    trigger-class="w-fit"
  />
</template>
