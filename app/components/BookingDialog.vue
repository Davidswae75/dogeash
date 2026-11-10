<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { CalendarCheck, CalendarDays, ChevronDown } from '@lucide/vue'
import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { computed, ref, watch } from 'vue'
import { isoDate, todayIso } from '~/utils/time'
import { useAccountGate } from '~/composables/useAccountGate'
import type { AccountGate } from '~/composables/useAccountGate'

// Book a time with someone: a care provider, or a kennel visit to see shortlisted dogs.
// Choose a service (several with `multipleServices`), one of the next six days the other party works (Monday
// to Saturday unless `weekdays` says otherwise) or any of their days up to `maxDays` (three weeks) ahead from
// the calendar, one of their times, and where. Fully booked days are crossed out; when every day is, `waitlist`
// lets the buyer ask to be told when a time frees up. With `initial` it changes an existing booking instead (`submitLabel`).
// With `send` the request is saved; without it the dialog is a preview. With `ownedDogs` (the buyer's My dogs) they pick the dog and can let the other
// party add the visit to its record.
export interface BookingSummaryRow { label: string, value: string }
export interface BookingRequestValues { service: string, services: string[], day: string, slot: string, place: 'home' | 'premises', ownedDogId: string | null, dogName: string, shareRecord: boolean }

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
  /** Let the buyer choose several services for one appointment (up to 5) */
  multipleServices?: boolean
  /** How far ahead the calendar goes, in days (three weeks) */
  maxDays?: number
  /** When every time is booked: ask to be told when one frees up. Returns an error, or null. */
  waitlist?: () => Promise<string | null>
  /** Changing a booking: what it is now. The dog can't be changed, so it isn't asked. */
  initial?: { services: string[], day: string, slot: string, place: 'home' | 'premises' }
  submitLabel?: string
  /** One of `ownedDogs` already chosen (booking from that dog's page), and whether it shares its record */
  presetDog?: string
  presetShare?: boolean
  /** Where the buyer finds the booking afterwards */
  doneLink?: { to: string, label: string }
  triggerSize?: 'sm' | 'default'
  /** Hide the trigger's calendar icon */
  plainTrigger?: boolean
  /** Save the request; returns an error message, or null when it was sent */
  send?: (booking: BookingRequestValues) => Promise<string | null>
}>(), {
  maxDays: 21,
  triggerSize: 'sm',
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
// Several services at once (multipleServices)
const serviceList = ref<string[]>([])
const chosenServices = computed(() => (props.multipleServices ? props.services.filter(s => serviceList.value.includes(s)) : service.value ? [service.value] : []))
const editing = computed(() => !!props.initial)
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
// (When changing a booking, its own current time isn't full for it)
const isFull = (slot: string) => !!day.value && props.fullSlots.includes(`${day.value} ${slot}`)
  && !(props.initial && props.initial.day === day.value && props.initial.slot === slot)
watch(day, () => { if (time.value && isFull(time.value)) time.value = '' })
watch(open, (o) => { if (o) props.loadFullSlots?.() })

// "Thu 12 Nov" for "2026-11-12" (read as a local date, not UTC)
const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })
}
const workdays = computed(() => props.weekdays ?? [1, 2, 3, 4, 5, 6])
// The next six days they work, looking up to four weeks ahead; a day picked further out on the calendar
// joins them at the end, chosen
const days = computed(() => {
  const out: { value: string, label: string }[] = []
  const d = new Date()
  for (let i = 0; i < 28 && out.length < 6; i++) {
    d.setDate(d.getDate() + 1)
    if (!workdays.value.includes(d.getDay())) continue
    const value = isoDate(d)
    out.push({ value, label: dayLabel(value) })
  }
  if (day.value && !out.some(o => o.value === day.value)) out.push({ value: day.value, label: dayLabel(day.value) })
  return out
})

// The calendar, for a day further out: from tomorrow to `maxDays` ahead, only on days they work
const showCalendar = ref(false)
const tz = getLocalTimeZone()
const minDate = computed(() => today(tz).add({ days: 1 }))
const maxDate = computed(() => today(tz).add({ days: props.maxDays }))
// Closed: a day they don't work, or one where every time is already booked
const isClosed = (date: DateValue) => !workdays.value.includes(date.toDate(tz).getDay()) || dayFull(date.toString())
const calendarDay = computed<DateValue | undefined>({
  get: () => (day.value ? parseDate(day.value) : undefined),
  set: (v) => {
    if (!v) return
    day.value = v.toString()
    showCalendar.value = false
  },
})
const weeksAhead = computed(() => Math.round(props.maxDays / 7))

// A day where every one of their times is taken
const dayFull = (iso: string) => times.value.every(t => props.fullSlots.includes(`${iso} ${t}`))
// Every day they work in the window is taken: nothing to choose, so offer to tell them when a time frees up
const allFull = computed(() => {
  if (!props.fullSlots.length) return false
  const d = new Date()
  for (let i = 1; i <= props.maxDays; i++) {
    d.setDate(d.getDate() + 1)
    if (workdays.value.includes(d.getDay()) && !dayFull(isoDate(d))) return false
  }
  return true
})
const waiting = ref<'idle' | 'busy' | 'done'>('idle')
async function joinWaitlist() {
  if (!props.waitlist) return
  waiting.value = 'busy'
  error.value = (await props.waitlist()) ?? ''
  waiting.value = error.value ? 'idle' : 'done'
}

const confirmation = computed<BookingSummaryRow[]>(() => [
  { label: 'With', value: props.title },
  { label: chosenServices.value.length > 1 ? 'Services' : 'Service', value: chosenServices.value.join(', ') },
  { label: 'When', value: `${day.value ? dayLabel(day.value) : ''}, ${time.value}` },
  { label: 'Where', value: place.value === 'home' ? 'At your home' : props.premisesLabel },
  ...props.summary,
  ...(chosenDog.value ? [{ label: 'Dog', value: chosenDog.value.label + (shareRecord.value ? ' · record shared' : '') }] : dogName.value ? [{ label: 'Dog', value: dogName.value }] : []),
])


const sending = ref(false)

async function submit() {
  if (day.value && day.value <= todayIso()) return (error.value = 'Choose a day from tomorrow on.')
  if (!chosenServices.value.length || !day.value || !time.value) return (error.value = `Choose ${props.multipleServices ? 'at least one service' : 'a service'}, a day and a time.`)
  if (chosenServices.value.length > 5) return (error.value = 'Choose up to 5 services for one appointment.')
  error.value = ''
  if (props.send) {
    sending.value = true
    error.value = (await props.send({
      service: chosenServices.value[0]!,
      services: chosenServices.value,
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
  serviceList.value = []
  showCalendar.value = false
  waiting.value = 'idle'
  shareRecord.value = true
  place.value = 'premises'
}
// Booking from a dog's page starts with that dog (and the owner's standing choice about its record);
// changing a booking starts from what it is now
function fill() {
  if (props.presetDog) {
    ownedDog.value = props.presetDog
    shareRecord.value = props.presetShare ?? true
  }
  const i = props.initial
  if (!i) return
  serviceList.value = [...i.services]
  service.value = i.services[0] ?? ''
  day.value = i.day > todayIso() ? i.day : ''
  time.value = i.slot
  place.value = i.place
}

watch(open, isOpen => (isOpen ? fill() : reset()))
watch([service, serviceList, day, time], () => { error.value = '' })

const legend = 'mb-2 text-xs leading-4 font-bold tracking-[.08em] uppercase'
const chips = 'flex w-auto flex-wrap justify-start gap-2'
</script>

<template>
  <Dialog v-model:open="open">
    <Button :variant="props.triggerVariant" :size="props.triggerSize" :class="props.triggerClass ?? 'w-fit'" @click="openDialog">
      <CalendarCheck v-if="!props.plainTrigger" aria-hidden="true" />{{ props.triggerLabel }}
    </Button>

    <DialogContent class="max-h-[90vh] overflow-y-auto border-line bg-surface sm:max-w-[520px]">
      <template v-if="step === 'form'">
        <DialogHeader>
          <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">{{ props.title }}</DialogTitle>
          <DialogDescription class="text-ink-muted">{{ props.description }}</DialogDescription>
        </DialogHeader>

        <form class="flex flex-col gap-5" @submit.prevent="submit">
          <fieldset class="m-0 border-0 p-0">
            <legend :class="legend">{{ props.multipleServices ? 'Services' : 'Service' }}<span v-if="props.multipleServices" class="font-normal tracking-normal normal-case text-ink-muted"> · choose one or more</span></legend>
            <ToggleGroup v-if="props.multipleServices" v-model="serviceList" type="multiple" variant="chip" :class="chips">
              <ToggleGroupItem v-for="s in props.services" :key="s" :value="s" :disabled="serviceList.length >= 5 && !serviceList.includes(s)" class="rounded-full!">{{ s }}</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup v-else v-model="service" type="single" variant="chip" :class="chips">
              <ToggleGroupItem v-for="s in props.services" :key="s" :value="s" class="rounded-full!">{{ s }}</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <!-- Every time in the window is taken: say so, and offer to tell them when one frees up -->
          <div v-if="allFull" class="flex flex-col items-start gap-2.5 rounded-lg bg-surface-sunk p-4 ring-1 ring-line" role="status">
            <p class="m-0 text-sm leading-5"><strong>Fully booked for the next {{ weeksAhead }} weeks.</strong> Times free up when someone cancels or moves a booking.</p>
            <template v-if="props.waitlist">
              <p v-if="waiting === 'done'" class="m-0 text-sm leading-5 font-semibold text-verified">We'll let you know as soon as a time frees up.</p>
              <Button v-else type="button" variant="outline" size="sm" :loading="waiting === 'busy'" @click="joinWaitlist">Tell me when a time frees up</Button>
            </template>
          </div>

          <fieldset v-if="!allFull" class="m-0 border-0 p-0">
            <legend :class="legend">Day</legend>
            <ToggleGroup v-model="day" type="single" variant="chip" :class="chips">
              <ToggleGroupItem v-for="d in days" :key="d.value" :value="d.value" :disabled="dayFull(d.value) && d.value !== props.initial?.day" :class="['rounded-full!', dayFull(d.value) && d.value !== props.initial?.day && 'line-through opacity-50']" :title="dayFull(d.value) ? 'Fully booked' : undefined">{{ d.label }}</ToggleGroupItem>
            </ToggleGroup>
            <!-- A day further out: the calendar, on the days they work, up to about three months ahead -->
            <button type="button" class="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-ink underline-offset-4 hover:underline" :aria-expanded="showCalendar" @click="showCalendar = !showCalendar">
              <CalendarDays class="size-4" aria-hidden="true" />{{ showCalendar ? 'Hide the calendar' : `Another date, up to ${weeksAhead} weeks ahead` }}
              <ChevronDown class="size-4 transition-transform" :class="showCalendar && 'rotate-180'" aria-hidden="true" />
            </button>
            <div v-if="showCalendar" class="mt-2 flex justify-center rounded-lg ring-1 ring-line">
              <Calendar v-model="calendarDay" :min-value="minDate" :max-value="maxDate" :is-date-disabled="isClosed" :placeholder="calendarDay ?? minDate" locale="en-NG" :week-starts-on="1" class="p-2" />
            </div>
          </fieldset>

          <fieldset v-if="!allFull" class="m-0 border-0 p-0">
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

          <div v-if="!editing && props.askDogName && props.ownedDogs.length" class="flex flex-col gap-2">
            <label for="booking-owned-dog" :class="legend">Which dog <span class="font-normal tracking-normal normal-case text-ink-muted">(optional)</span></label>
            <SelectMenu id="booking-owned-dog" v-model="ownedDog" :options="dogOptions" placeholder="Choose from My dogs" />
            <Input v-if="ownedDog === 'other'" v-model="dogName" aria-label="Your dog's name" placeholder="Kaiser" class="border-line-strong" />
            <label v-if="chosenDog" class="flex items-start gap-2.5 text-sm leading-5">
              <Checkbox v-model="shareRecord" class="mt-0.5" />
              <span>Let {{ props.title }} add this visit to {{ chosenDog.label }}'s record <span class="text-ink-muted">(vaccinations, treatments, next due dates). They see only what they add.</span></span>
            </label>
          </div>
          <div v-else-if="!editing && props.askDogName" class="flex flex-col gap-2">
            <label for="booking-dog" :class="legend">Your dog's name <span class="font-normal tracking-normal normal-case text-ink-muted">(optional)</span></label>
            <Input id="booking-dog" v-model="dogName" placeholder="Kaiser" class="border-line-strong" />
          </div>

          <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>

          <DialogFooter class="flex-col gap-3 sm:flex-col">
            <Button v-if="!allFull" type="submit" variant="marigold" class="w-full" :loading="sending">{{ props.submitLabel ?? 'Request booking' }}</Button>
            <p v-if="props.priceNote" class="m-0 text-center text-xs text-ink-muted">{{ props.priceNote }}</p>
          </DialogFooter>
        </form>
      </template>

      <div v-else class="flex flex-col items-start gap-4">
        <span class="grid size-12 place-items-center rounded-full bg-marigold text-on-marigold"><AppIcon name="check" :size="24" /></span>
        <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">{{ editing ? 'Booking changed' : props.send ? 'Request sent' : 'Request ready' }}</DialogTitle>
        <dl class="m-0 grid w-full grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-md bg-surface-sunk p-4 text-sm">
          <template v-for="row in confirmation" :key="row.label">
            <dt class="font-semibold">{{ row.label }}</dt><dd class="m-0">{{ row.value }}</dd>
          </template>
        </dl>
        <DialogDescription class="m-0 text-sm leading-[22px] text-ink-muted">
          {{ editing ? 'They\'re told about the change and confirm the new time with you. You can change it again until they answer.' : props.send ? `${props.confirmText ?? 'The store confirms the time with you.'} You'll find it in ${props.doneLink ? 'Care appointments' : 'Kennel visits'} in your account.` : 'This is a preview. Requests are not sent yet: online booking for care opens soon.' }}
        </DialogDescription>
        <div class="flex w-full flex-col gap-2">
          <Button v-if="props.send && !editing" as-child variant="marigold" class="w-full"><NuxtLink :to="props.doneLink?.to ?? '/account/visits'">{{ props.doneLink?.label ?? 'See my visits' }}</NuxtLink></Button>
          <DialogClose as-child>
            <Button variant="outline" class="w-full">Done</Button>
          </DialogClose>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
