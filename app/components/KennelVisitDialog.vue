<script setup lang="ts">
import type { Dog } from '~/utils/dogs'
import type { Store } from '~/utils/stores'
import { computed, ref } from 'vue'
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
// Reserved dogs are held for another buyer: a visit is only for the ones still available
const dogs = computed(() => props.dogs.filter(d => d.status !== 'reserved'))
const allReserved = computed(() => props.dogs.length > 0 && dogs.value.length === 0)
const names = computed(() => dogs.value.map(d => d.name).join(', '))
const summary = computed(() => dogs.value.length ? [{ label: dogs.value.length === 1 ? 'Dog' : 'Dogs', value: names.value }] : [])

const gate = computed<AccountGate>(() => ({
  key: `visit:${props.store.id}${dogs.value.length === 1 ? `:${dogs.value[0]!.fileNo}` : ''}`,
  action: dogs.value.length === 1 ? `visit ${dogs.value[0]!.name} at ${props.store.name}` : `book a visit with ${props.store.name}`,
  reason: 'The store needs to know who\'s coming to the gate, and confirms the time with you by SMS.',
}))

// Saved as a visit request (Supabase: visits); the store confirms it from its inbox
const visits = useVisits()
const send = (b: { service: string, day: string, slot: string, place: 'home' | 'premises' }) =>
  visits.request({ storeId: props.store.id, dogFileNos: dogs.value.map(d => d.fileNo), service: b.service, day: b.day, slot: b.slot, place: b.place === 'home' ? 'home' : 'kennel' })
// Times another buyer has already taken (up to the store's visitors per time), loaded when the dialog opens
const full = ref<string[]>([])
const loadFull = async () => { full.value = await visits.fullSlots(props.store.id) }
</script>

<template>
  <BookingDialog
    v-if="!settings.paused && !allReserved"
    :title="props.store.name"
    :description="`Kennel visit in ${props.store.area}, ${props.store.city} · ${props.store.hours}`"
    :services="kennelVisitServices"
    premises-label="At the kennel"
    :weekdays="settings.days"
    :slots="settings.slots"
    :full-slots="full"
    :load-full-slots="loadFull"
    :home-visits="settings.home"
    :summary="summary"
    :trigger-label="props.label"
    :trigger-variant="props.variant"
    :trigger-class="props.triggerClass"
    :gate="gate"
    :send="send"
    price-note="Kennel visits are free. The store confirms the time with you."
  />
  <Button v-else-if="allReserved" :variant="props.variant" :class="props.triggerClass" disabled title="Another buyer has paid a deposit">Reserved: no visits</Button>
  <Button v-else :variant="props.variant" :class="props.triggerClass" disabled :title="settings.note || 'This store isn\'t taking visit requests right now.'">
    Visits paused{{ settings.note ? ` · ${settings.note}` : '' }}
  </Button>
</template>
