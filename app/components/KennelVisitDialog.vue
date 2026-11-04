<script setup lang="ts">
import type { Dog } from '~/utils/dogs'
import type { Store } from '~/utils/stores'
import { computed } from 'vue'
import type { AccountGate } from '~/composables/useAccountGate'
import { kennelVisitServices, visitSettings } from '~/utils/stores'
import { useVisits } from '~/composables/useVisits'

// Book a kennel visit with a store, for one dog, several shortlisted dogs, or just to see the kennel.
// The shared booking dialog, filled in from the store and its visit settings (days, times, home visits);
// needs an account. While the store has paused visits, a disabled button says so instead.
const props = withDefaults(defineProps<{
  store: Store
  dogs?: Dog[]
  label?: string
  variant?: 'outline' | 'default' | 'marigold' | 'night'
  triggerClass?: string
}>(), { dogs: () => [], label: 'Book a kennel visit', variant: 'outline' })

const settings = computed(() => visitSettings(props.store))
const names = computed(() => props.dogs.map(d => d.name).join(', '))
const summary = computed(() => props.dogs.length ? [{ label: props.dogs.length === 1 ? 'Dog' : 'Dogs', value: names.value }] : [])

const gate = computed<AccountGate>(() => ({
  key: `visit:${props.store.id}${props.dogs.length === 1 ? `:${props.dogs[0]!.fileNo}` : ''}`,
  action: props.dogs.length === 1 ? `visit ${props.dogs[0]!.name} at ${props.store.name}` : `book a visit with ${props.store.name}`,
  reason: 'The store needs to know who\'s coming to the gate, and confirms the time with you by SMS.',
}))

// Saved as a visit request (Supabase: visits); the store confirms it from its inbox
const visits = useVisits()
const send = (b: { service: string, day: string, slot: string, place: 'home' | 'premises' }) =>
  visits.request({ storeId: props.store.id, dogFileNos: props.dogs.map(d => d.fileNo), service: b.service, day: b.day, slot: b.slot, place: b.place === 'home' ? 'home' : 'kennel' })
</script>

<template>
  <BookingDialog
    v-if="!settings.paused"
    :title="props.store.name"
    :description="`Kennel visit in ${props.store.area}, ${props.store.city} · ${props.store.hours}`"
    :services="kennelVisitServices"
    premises-label="At the kennel"
    :weekdays="settings.days"
    :slots="settings.slots"
    :home-visits="settings.home"
    :summary="summary"
    :trigger-label="props.label"
    :trigger-variant="props.variant"
    :trigger-class="props.triggerClass"
    :gate="gate"
    :send="send"
    price-note="Kennel visits are free. The store confirms the time with you."
  />
  <Button v-else :variant="props.variant" :class="props.triggerClass" disabled :title="settings.note || 'This store isn\'t taking visit requests right now.'">
    Visits paused{{ settings.note ? ` · ${settings.note}` : '' }}
  </Button>
</template>
