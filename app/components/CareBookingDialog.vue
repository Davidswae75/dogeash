<script setup lang="ts">
import { CalendarCheck } from '@lucide/vue'
import type { CareProvider } from '~/utils/care'

// Book an appointment with a care provider. UI preview: requests are not sent until bookings launch.
const props = withDefaults(defineProps<{ provider: CareProvider, label?: string }>(), { label: 'Book appointment' })

const open = ref(false)
const step = ref<'form' | 'done'>('form')
const service = ref<string>('')
const day = ref<string>('')
const time = ref<string>('')
const place = ref<string>('provider')
const dogName = ref('')
const error = ref('')

const services = computed(() => careTypes[props.provider.type].services)
const times = ['9:00', '10:30', '12:00', '14:00', '15:30']

// The next six working days (Sundays off)
const days = computed(() => {
  const out: { value: string, label: string }[] = []
  const d = new Date()
  while (out.length < 6) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0) continue
    out.push({
      value: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }),
    })
  }
  return out
})

const dayLabel = computed(() => days.value.find(d => d.value === day.value)?.label)

function submit() {
  if (!service.value || !day.value || !time.value) {
    error.value = 'Choose a service, a day and a time.'
    return
  }
  error.value = ''
  step.value = 'done'
}

watch(open, (isOpen) => {
  if (isOpen) return
  step.value = 'form'
  service.value = day.value = time.value = dogName.value = error.value = ''
  place.value = 'provider'
})

watch([service, day, time], () => { error.value = '' })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button variant="outline" size="sm" class="w-fit">
        <CalendarCheck aria-hidden="true" />{{ props.label }}
      </Button>
    </DialogTrigger>

    <DialogContent class="max-h-[90vh] overflow-y-auto border-line bg-surface sm:max-w-[520px]">
      <template v-if="step === 'form'">
        <DialogHeader>
          <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">Book {{ props.provider.name }}</DialogTitle>
          <DialogDescription class="text-ink-muted">
            {{ careTypes[props.provider.type].label }} · {{ props.provider.areas }}
          </DialogDescription>
        </DialogHeader>

        <form class="flex flex-col gap-5" @submit.prevent="submit">
          <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
            <legend class="mb-2 text-xs leading-4 font-bold tracking-[.08em] uppercase">Service</legend>
            <ToggleGroup v-model="service" type="single" variant="chip" class="flex w-auto flex-wrap justify-start gap-2">
              <ToggleGroupItem v-for="s in services" :key="s" :value="s" class="rounded-full!">{{ s }}</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
            <legend class="mb-2 text-xs leading-4 font-bold tracking-[.08em] uppercase">Day</legend>
            <ToggleGroup v-model="day" type="single" variant="chip" class="flex w-auto flex-wrap justify-start gap-2">
              <ToggleGroupItem v-for="d in days" :key="d.value" :value="d.value" class="rounded-full!">{{ d.label }}</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
            <legend class="mb-2 text-xs leading-4 font-bold tracking-[.08em] uppercase">Time</legend>
            <ToggleGroup v-model="time" type="single" variant="chip" class="flex w-auto flex-wrap justify-start gap-2">
              <ToggleGroupItem v-for="t in times" :key="t" :value="t" class="rounded-full! font-mono">{{ t }}</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <fieldset v-if="props.provider.homeVisits" class="m-0 flex flex-col gap-2 border-0 p-0">
            <legend class="mb-2 text-xs leading-4 font-bold tracking-[.08em] uppercase">Where</legend>
            <ToggleGroup v-model="place" type="single" variant="chip" class="flex w-auto flex-wrap justify-start gap-2">
              <ToggleGroupItem value="provider" class="rounded-full!">At their premises</ToggleGroupItem>
              <ToggleGroupItem value="home" class="rounded-full!">At my home</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <div class="flex flex-col gap-2">
            <label for="booking-dog" class="text-xs leading-4 font-bold tracking-[.08em] uppercase">Your dog's name <span class="font-normal tracking-normal normal-case text-ink-muted">(optional)</span></label>
            <Input id="booking-dog" v-model="dogName" placeholder="Kaiser" class="border-line-strong" />
          </div>

          <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>

          <DialogFooter class="flex-col gap-3 sm:flex-col">
            <Button type="submit" variant="marigold" class="w-full">Request appointment</Button>
            <p class="m-0 text-center text-xs text-ink-muted">From {{ formatNaira(props.provider.priceFrom) }}. You pay the provider directly for now.</p>
          </DialogFooter>
        </form>
      </template>

      <div v-else class="flex flex-col items-start gap-4">
        <span class="grid size-12 place-items-center rounded-full bg-marigold text-on-marigold"><AppIcon name="check" :size="24" /></span>
        <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">Request ready</DialogTitle>
        <dl class="m-0 grid w-full grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-md bg-surface-sunk p-4 text-sm">
          <dt class="font-semibold">Provider</dt><dd class="m-0">{{ props.provider.name }}</dd>
          <dt class="font-semibold">Service</dt><dd class="m-0">{{ service }}</dd>
          <dt class="font-semibold">When</dt><dd class="m-0">{{ dayLabel }}, {{ time }}</dd>
          <dt class="font-semibold">Where</dt><dd class="m-0">{{ place === 'home' ? 'At your home' : 'At their premises' }}</dd>
          <template v-if="dogName"><dt class="font-semibold">Dog</dt><dd class="m-0">{{ dogName }}</dd></template>
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
