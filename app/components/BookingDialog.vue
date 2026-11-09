<script setup lang="ts">
import { CalendarCheck } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useAccountGate } from '~/composables/useAccountGate'
import type { AccountGate } from '~/composables/useAccountGate'

// Book a time with someone: a care provider, or a kennel visit to see shortlisted dogs.
// Choose a service, one of the next six days the other party works (Monday to Saturday unless `weekdays`
// says otherwise), one of their times, and where. With `send` the request is saved; without it the
// dialog is a preview. With `ownedDogs` (the buyer's My dogs) they pick the dog and can let the other
// party add the visit to its record.
export interface BookingSummaryRow { label: string, value: string }

const props = withDefaults(defineProps<{
  title: string
  description: string
  services: string[]
  /** Offer "At my home" as well as the other party's premises */
  homeVisits?: boolean
  /** Days they take bookings, 0 = Sunday (default Monday to Saturday) */
  weekdays?: number[]
  /** Times they take bookings, like "9:00" (default five through the day) */
  slots?: string[]
  premisesLabel?: string
  priceNote?: string
  /** Extra lines for the confirmation, e.g. which dogs */
  summary?: BookingSummaryRow[]
  askDogName?: boolean
  /** Times already taken, as "2026-11-12 9:00": shown as booked and can't be chosen */
  fullSlots?: string[]
  /** Loads `fullSlots` fresh when the dialog opens */
  loadFullSlots?: () => void
  /** The buyer's own dogs (My dogs), offered instead of typing a name */
  ownedDogs?: { value: string, label: string }[]
  triggerLabel?: string
  triggerVariant?: 'outline' | 'default' | 'marigold' | 'night'
  triggerClass?: string
  /** After sending: who confirms, e.g. "The provider confirms the time with you." */
  confirmText?: string
  /** Ask signed-out visitors to sign in first (see useAccountGate) */
  gate?: AccountGate
  /** Save the request; returns an error message, or null when it was sent */
  send?: (booking: { service: string, day: string, slot: string, place: 'home' | 'premises', ownedDogId: string | null, dogName: string, shareRecord: boolean }) => Promise<string | null>
}>(), {
  homeVisits: false,
  premisesLabel: 'At their premises',
  askDogName: false,
  triggerLabel: 'Book',
  triggerVariant: 'outline',
  summary: () => [],
  ownedDogs: () => [],
  fullSlots: () => [],
})

const open = ref(false)
const { guard } = useAccountGate(() => props.gate ?? { key: '', action: '', reason: '' }, () => { open.value = true })
// Ungated dialogs (inside the account area) just open
const openDialog = () => (props.gate ? guard() : (open.value = true))
const step = ref<'form' | 'done'>('form')
const service = ref('')
const day = ref('')
const time = ref('')
const place = ref('premises')
const dogName = ref('')
// One of My dogs ('' = typing a name instead), and whether they may add the visit to its record
const ownedDog = ref('')
const shareRecord = ref(true)
const dogOptions = computed(() => [...props.ownedDogs, { value: 'other', label: 'Another dog' }])
const chosenDog = computed(() => props.ownedDogs.find(d => d.value === ownedDog.value))
const error = ref('')

const times = computed(() => props.slots ?? ['9:00', '10:30', '12:00', '14:00', '15:30'])
// A time someone else already has on the chosen day can't be picked
const isFull = (slot: string) => !!day.value && props.fullSlots.includes(`${day.value} ${slot}`)
watch(day, () => { if (time.value && isFull(time.value)) time.value = '' })
watch(open, (o) => { if (o) props.loadFullSlots?.() })

// The next six days they work, looking up to four weeks ahead
const days = computed(() => {
  const open = props.weekdays ?? [1, 2, 3, 4, 5, 6]
  const out: { value: string, label: string }[] = []
  const d = new Date()
  for (let i = 0; i < 28 && out.length < 6; i++) {
    d.setDate(d.getDate() + 1)
    if (!open.includes(d.getDay())) continue
    // The local date, not UTC: just after midnight in Lagos, UTC is still on yesterday
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({ value, label: d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }) })
  }
  return out
})

const confirmation = computed<BookingSummaryRow[]>(() => [
  { label: 'With', value: props.title },
  { label: 'Service', value: service.value },
  { label: 'When', value: `${days.value.find(d => d.value === day.value)?.label}, ${time.value}` },
  { label: 'Where', value: place.value === 'home' ? 'At your home' : props.premisesLabel },
  ...props.summary,
  ...(chosenDog.value ? [{ label: 'Dog', value: chosenDog.value.label + (shareRecord.value ? ' · record shared' : '') }] : dogName.value ? [{ label: 'Dog', value: dogName.value }] : []),
])


const sending = ref(false)

async function submit() {
  if (!service.value || !day.value || !time.value) return (error.value = 'Choose a service, a day and a time.')
  error.value = ''
  if (props.send) {
    sending.value = true
    error.value = (await props.send({
      service: service.value,
      day: day.value,
      slot: time.value,
      place: place.value as 'home' | 'premises',
      ownedDogId: chosenDog.value?.value ?? null,
      dogName: chosenDog.value ? '' : dogName.value,
      shareRecord: !!chosenDog.value && shareRecord.value,
    })) ?? ''
    sending.value = false
    if (error.value) return
  }
  step.value = 'done'
}

function reset() {
  step.value = 'form'
  service.value = day.value = time.value = dogName.value = ownedDog.value = error.value = ''
  shareRecord.value = true
  place.value = 'premises'
}

watch(open, isOpen => !isOpen && reset())
watch([service, day, time], () => { error.value = '' })

const legend = 'mb-2 text-xs leading-4 font-bold tracking-[.08em] uppercase'
const chips = 'flex w-auto flex-wrap justify-start gap-2'
</script>

<template>
  <Dialog v-model:open="open">
    <Button :variant="props.triggerVariant" size="sm" :class="props.triggerClass ?? 'w-fit'" @click="openDialog">
      <CalendarCheck aria-hidden="true" />{{ props.triggerLabel }}
    </Button>

    <DialogContent class="max-h-[90vh] overflow-y-auto border-line bg-surface sm:max-w-[520px]">
      <template v-if="step === 'form'">
        <DialogHeader>
          <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">{{ props.title }}</DialogTitle>
          <DialogDescription class="text-ink-muted">{{ props.description }}</DialogDescription>
        </DialogHeader>

        <form class="flex flex-col gap-5" @submit.prevent="submit">
          <fieldset class="m-0 border-0 p-0">
            <legend :class="legend">Service</legend>
            <ToggleGroup v-model="service" type="single" variant="chip" :class="chips">
              <ToggleGroupItem v-for="s in props.services" :key="s" :value="s" class="rounded-full!">{{ s }}</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <fieldset class="m-0 border-0 p-0">
            <legend :class="legend">Day</legend>
            <ToggleGroup v-model="day" type="single" variant="chip" :class="chips">
              <ToggleGroupItem v-for="d in days" :key="d.value" :value="d.value" class="rounded-full!">{{ d.label }}</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <fieldset class="m-0 border-0 p-0">
            <legend :class="legend">Time</legend>
            <ToggleGroup v-model="time" type="single" variant="chip" :class="chips">
              <ToggleGroupItem v-for="t in times" :key="t" :value="t" :disabled="isFull(t)" :class="['rounded-full! font-mono', isFull(t) && 'line-through opacity-50']" :title="isFull(t) ? 'Already booked' : undefined">{{ t }}</ToggleGroupItem>
            </ToggleGroup>
            <p v-if="day && times.some(isFull)" class="m-0 mt-2 text-xs text-ink-muted">Crossed-out times are already booked.</p>
          </fieldset>

          <fieldset v-if="props.homeVisits" class="m-0 border-0 p-0">
            <legend :class="legend">Where</legend>
            <ToggleGroup v-model="place" type="single" variant="chip" :class="chips">
              <ToggleGroupItem value="premises" class="rounded-full!">{{ props.premisesLabel }}</ToggleGroupItem>
              <ToggleGroupItem value="home" class="rounded-full!">At my home</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <div v-if="props.askDogName && props.ownedDogs.length" class="flex flex-col gap-2">
            <label for="booking-owned-dog" :class="legend">Which dog <span class="font-normal tracking-normal normal-case text-ink-muted">(optional)</span></label>
            <SelectMenu id="booking-owned-dog" v-model="ownedDog" :options="dogOptions" placeholder="Choose from My dogs" />
            <Input v-if="ownedDog === 'other'" v-model="dogName" aria-label="Your dog's name" placeholder="Kaiser" class="border-line-strong" />
            <label v-if="chosenDog" class="flex items-start gap-2.5 text-sm leading-5">
              <Checkbox v-model="shareRecord" class="mt-0.5" />
              <span>Let {{ props.title }} add this visit to {{ chosenDog.label }}'s record <span class="text-ink-muted">(vaccinations, treatments, next due dates). They see only what they add.</span></span>
            </label>
          </div>
          <div v-else-if="props.askDogName" class="flex flex-col gap-2">
            <label for="booking-dog" :class="legend">Your dog's name <span class="font-normal tracking-normal normal-case text-ink-muted">(optional)</span></label>
            <Input id="booking-dog" v-model="dogName" placeholder="Kaiser" class="border-line-strong" />
          </div>

          <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>

          <DialogFooter class="flex-col gap-3 sm:flex-col">
            <Button type="submit" variant="marigold" class="w-full" :loading="sending">Request booking</Button>
            <p v-if="props.priceNote" class="m-0 text-center text-xs text-ink-muted">{{ props.priceNote }}</p>
          </DialogFooter>
        </form>
      </template>

      <div v-else class="flex flex-col items-start gap-4">
        <span class="grid size-12 place-items-center rounded-full bg-marigold text-on-marigold"><AppIcon name="check" :size="24" /></span>
        <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">{{ props.send ? 'Request sent' : 'Request ready' }}</DialogTitle>
        <dl class="m-0 grid w-full grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-md bg-surface-sunk p-4 text-sm">
          <template v-for="row in confirmation" :key="row.label">
            <dt class="font-semibold">{{ row.label }}</dt><dd class="m-0">{{ row.value }}</dd>
          </template>
        </dl>
        <DialogDescription class="m-0 text-sm leading-[22px] text-ink-muted">
          {{ props.send ? `${props.confirmText ?? 'The store confirms the time with you.'} You'll find it in Visits and bookings in your account.` : 'This is a preview. Requests are not sent yet: online booking for care opens soon.' }}
        </DialogDescription>
        <div class="flex w-full flex-col gap-2">
          <Button v-if="props.send" as-child variant="marigold" class="w-full"><NuxtLink to="/account/bookings">See my visits</NuxtLink></Button>
          <DialogClose as-child>
            <Button variant="outline" class="w-full">Done</Button>
          </DialogClose>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
