<script setup lang="ts">
import { CalendarCheck } from '@lucide/vue'

// Book a time with someone: a care provider, or a kennel visit to see shortlisted dogs.
// Choose a service, one of the next six working days, a time, and where. UI preview: nothing is sent yet.
export interface BookingSummaryRow { label: string, value: string }

const props = withDefaults(defineProps<{
  title: string
  description: string
  services: string[]
  /** Offer "At my home" as well as the other party's premises */
  homeVisits?: boolean
  premisesLabel?: string
  priceNote?: string
  /** Extra lines for the confirmation, e.g. which dogs */
  summary?: BookingSummaryRow[]
  askDogName?: boolean
  triggerLabel?: string
  triggerVariant?: 'outline' | 'default' | 'marigold' | 'night'
  triggerClass?: string
  /** Ask signed-out visitors to sign in first (see useAccountGate) */
  gate?: AccountGate
}>(), {
  homeVisits: false,
  premisesLabel: 'At their premises',
  askDogName: false,
  triggerLabel: 'Book',
  triggerVariant: 'outline',
  summary: () => [],
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
const error = ref('')

const times = ['9:00', '10:30', '12:00', '14:00', '15:30']

// The next six working days (Sundays off)
const days = computed(() => {
  const out: { value: string, label: string }[] = []
  const d = new Date()
  while (out.length < 6) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0) continue
    out.push({ value: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }) })
  }
  return out
})

const confirmation = computed<BookingSummaryRow[]>(() => [
  { label: 'With', value: props.title },
  { label: 'Service', value: service.value },
  { label: 'When', value: `${days.value.find(d => d.value === day.value)?.label}, ${time.value}` },
  { label: 'Where', value: place.value === 'home' ? 'At your home' : props.premisesLabel },
  ...props.summary,
  ...(dogName.value ? [{ label: 'Dog', value: dogName.value }] : []),
])

const notify = useNotify()

function submit() {
  if (!service.value || !day.value || !time.value) return (error.value = 'Choose a service, a day and a time.')
  error.value = ''
  step.value = 'done'
  notify.bookingRequested(props.title, confirmation.value.find(r => r.label === 'When')!.value)
}

function reset() {
  step.value = 'form'
  service.value = day.value = time.value = dogName.value = error.value = ''
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
              <ToggleGroupItem v-for="t in times" :key="t" :value="t" class="rounded-full! font-mono">{{ t }}</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <fieldset v-if="props.homeVisits" class="m-0 border-0 p-0">
            <legend :class="legend">Where</legend>
            <ToggleGroup v-model="place" type="single" variant="chip" :class="chips">
              <ToggleGroupItem value="premises" class="rounded-full!">{{ props.premisesLabel }}</ToggleGroupItem>
              <ToggleGroupItem value="home" class="rounded-full!">At my home</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <div v-if="props.askDogName" class="flex flex-col gap-2">
            <label for="booking-dog" :class="legend">Your dog's name <span class="font-normal tracking-normal normal-case text-ink-muted">(optional)</span></label>
            <Input id="booking-dog" v-model="dogName" placeholder="Kaiser" class="border-line-strong" />
          </div>

          <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>

          <DialogFooter class="flex-col gap-3 sm:flex-col">
            <Button type="submit" variant="marigold" class="w-full">Request booking</Button>
            <p v-if="props.priceNote" class="m-0 text-center text-xs text-ink-muted">{{ props.priceNote }}</p>
          </DialogFooter>
        </form>
      </template>

      <div v-else class="flex flex-col items-start gap-4">
        <span class="grid size-12 place-items-center rounded-full bg-marigold text-on-marigold"><AppIcon name="check" :size="24" /></span>
        <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">Request ready</DialogTitle>
        <dl class="m-0 grid w-full grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-md bg-surface-sunk p-4 text-sm">
          <template v-for="row in confirmation" :key="row.label">
            <dt class="font-semibold">{{ row.label }}</dt><dd class="m-0">{{ row.value }}</dd>
          </template>
        </dl>
        <DialogDescription class="m-0 text-sm leading-[22px] text-ink-muted">
          This is a preview. Requests are not sent yet: online booking opens with Dogeash accounts.
        </DialogDescription>
        <DialogClose as-child>
          <Button variant="outline" class="w-full">Done</Button>
        </DialogClose>
      </div>
    </DialogContent>
  </Dialog>
</template>
