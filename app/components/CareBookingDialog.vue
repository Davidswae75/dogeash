<script setup lang="ts">
import type { CareProvider } from '~/utils/care'
import { LayoutDashboard } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import type { AccountGate } from '~/composables/useAccountGate'
import { useCareBookings } from '~/composables/useCareBookings'
import { useOwnedDogs } from '~/composables/useOwnedDogs'
import { useSession } from '~/composables/useSession'
import { careTypes } from '~/utils/care'
import { formatNaira } from '~/utils/dogs'

// Book a care provider: the shared booking dialog, on the provider's own days and times. Buyers pick one of
// My dogs and can let the provider add the visit to its record. The provider answers from their dashboard.
// Someone who manages this listing can't book it: they get a way to their dashboard instead.
const props = withDefaults(defineProps<{ provider: CareProvider, label?: string, variant?: 'outline' | 'default' | 'marigold' | 'night', triggerClass?: string }>(), { label: 'Book appointment', variant: 'outline' })

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
const send = (b: { service: string, day: string, slot: string, place: 'home' | 'premises', ownedDogId: string | null, dogName: string, shareRecord: boolean }) =>
  bookings.request({ providerId: props.provider.id, ...b })
</script>

<template>
  <Button v-if="managesIt" as-child :variant="props.variant" :class="props.triggerClass" title="You manage this listing, so you answer its bookings">
    <NuxtLink to="/provider"><LayoutDashboard aria-hidden="true" />{{ props.label === 'Book' ? 'Your listing' : 'Your listing: open bookings' }}</NuxtLink>
  </Button>
  <BookingDialog
    v-else-if="props.provider.takingBookings !== false"
    :title="props.provider.name"
    :description="`${careTypes[props.provider.type].label} · ${props.provider.areas}${props.provider.hours ? ` · ${props.provider.hours}` : ''}`"
    :services="careTypes[props.provider.type].services"
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
  />
  <Button v-else :variant="props.variant" :class="props.triggerClass" disabled>Not taking bookings right now</Button>
</template>
