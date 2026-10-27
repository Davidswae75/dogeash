<script setup lang="ts">
import type { CareProvider } from '~/utils/care'

// Book a care provider: the shared booking dialog, filled in from the provider
const props = withDefaults(defineProps<{ provider: CareProvider, label?: string }>(), { label: 'Book appointment' })

const gate = computed<AccountGate>(() => ({
  key: `care:${props.provider.id}`,
  action: `book ${props.provider.name}`,
  reason: 'Providers confirm appointments with a name and phone number, and the booking is added to your dog\'s record.',
}))
</script>

<template>
  <BookingDialog
    :title="props.provider.name"
    :description="`${careTypes[props.provider.type].label} · ${props.provider.areas}`"
    :services="careTypes[props.provider.type].services"
    :home-visits="props.provider.homeVisits"
    :price-note="`From ${formatNaira(props.provider.priceFrom)}. You pay the provider directly for now.`"
    :trigger-label="props.label"
    :gate="gate"
    ask-dog-name
  />
</template>
