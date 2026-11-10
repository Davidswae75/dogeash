<script setup lang="ts">
import type { CareProvider } from '~/utils/care'
import { LayoutDashboard } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import type { AccountGate } from '~/composables/useAccountGate'
import type { BookingRequestValues } from '~/components/BookingDialog.vue'
import { useCareBookings } from '~/composables/useCareBookings'
import { useOwnedDogs } from '~/composables/useOwnedDogs'
import { useSession } from '~/composables/useSession'
import { careTypes, providerServices } from '~/utils/care'
import { formatNaira } from '~/utils/dogs'

// Book a care provider: the shared booking dialog, on the provider's own days and times, with one or more
// of their services in one appointment and any of their days up to three weeks ahead. Fully booked, the buyer
// can ask to be told when a time frees up. Buyers pick one of
// My dogs and can let the provider add the visit to its record. The provider answers from their dashboard.
// Someone who manages this listing can't book it: they get a way to their dashboard instead.
// From a dog's page, `dogId` picks that dog already and `share` is the owner's choice about its record.
const props = withDefaults(defineProps<{ provider: CareProvider, label?: string, variant?: 'outline' | 'default' | 'marigold' | 'night', triggerClass?: string, dogId?: string, share?: boolean }>(), { label: 'Book appointment', variant: 'outline' })

const gate = computed<AccountGate>(() => ({
  key: `care:${props.provider.id}`,
  action: `book ${props.provider.name}`,
  reason: 'Providers confirm appointments with a name and phone number, and can add the visit to your dog\'s record.',
}))

const { signedIn, providers } = useSession()
const managesIt = computed(() => providers.value.some(p => p.id === props.provider.id))
const owned = useOwnedDogs()
onMounted(() => { if (signedIn.value) owned.ensure() })
const ownedDogs = computed(() => owned.dogs.value.map(d => ({ value: d.id, label: d.name })))

const bookings = useCareBookings()
// Times others already have: crossed out in the dialog
const full = ref<string[]>([])
const loadFull = async () => { full.value = await bookings.fullSlots(props.provider.id) }
const send = (b: BookingRequestValues) => bookings.request({ providerId: props.provider.id, ...b })
</script>

<template>
  <Button v-if="managesIt" as-child :variant="props.variant" :class="props.triggerClass" title="You manage this listing, so you answer its bookings">
    <NuxtLink to="/provider"><LayoutDashboard aria-hidden="true" />{{ props.label === 'Book' ? 'Your listing' : 'Your listing: open bookings' }}</NuxtLink>
  </Button>
  <BookingDialog
    v-else-if="props.provider.takingBookings !== false"
    :title="props.provider.name"
    :description="`${careTypes[props.provider.type].label} · ${props.provider.areas}${props.provider.hours ? ` · ${props.provider.hours}` : ''}`"
    :services="providerServices(props.provider)"
    :full-slots="full"
    :load-full-slots="loadFull"
    :home-visits="props.provider.homeVisits"
    :weekdays="props.provider.weekdays"
    :slots="props.provider.slots"
    :price-note="`From ${formatNaira(props.provider.priceFrom)}. You pay the provider directly.`"
    :trigger-label="props.label"
    :trigger-variant="props.variant"
    :trigger-class="props.triggerClass"
    :gate="gate"
    :send="send"
    :owned-dogs="ownedDogs"
    confirm-text="The provider confirms the time with you."
    ask-dog-name
    multiple-services
    :preset-dog="props.dogId"
    :preset-share="props.share"
    :done-link="{ to: '/account/care', label: 'See my appointments' }"
    :waitlist="() => bookings.joinWaitlist(props.provider.id)"
  />
  <Button v-else :variant="props.variant" :class="props.triggerClass" disabled>Not taking bookings right now</Button>
</template>
