<script setup lang="ts">
import { BadgeCheck } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useSeoMeta } from '#imports' // nuxt
import { useNotify } from '~/composables/useNotify'
import { useProviderDashboard } from '~/composables/useProviderDashboard'
import { careServiceGroups, careTypes, providerServices } from '~/utils/care'

// Provider dashboard › Your listing: what buyers read on the provider's page, and the days and times they
// can book. The name, type, city, credential and the "checked" badge are Dogeash's, shown but not editable.
useSeoMeta({ title: 'Your listing · Provider dashboard · Dogeash', robots: 'noindex' })

const dash = useProviderDashboard()
const { listing } = dash

const person = ref('')
const areas = ref('')
const about = ref('')
const hours = ref('')
const price = ref('')
const homeVisits = ref(false)
const takingBookings = ref(true)
const weekdays = ref<string[]>([])
const slots = ref<string[]>([])
const services = ref<string[]>([])
const capacity = ref('1')
watch(listing, (l) => {
  if (!l) return
  person.value = l.person ?? ''
  areas.value = l.areas
  about.value = l.about ?? ''
  hours.value = l.hours ?? ''
  price.value = String(l.priceFrom)
  homeVisits.value = l.homeVisits
  takingBookings.value = l.takingBookings !== false
  weekdays.value = (l.weekdays ?? [1, 2, 3, 4, 5, 6]).map(String)
  slots.value = l.slots ?? []
  services.value = providerServices(l)
  capacity.value = String(l.slotCapacity ?? 1)
}, { immediate: true })

const dayOptions = [1, 2, 3, 4, 5, 6, 0].map(d => ({ value: String(d), label: new Date(2026, 10, 1 + d).toLocaleDateString('en-NG', { weekday: 'short' }) }))
const timeOptions = computed(() => [...new Set([...Array.from({ length: 13 }, (_, i) => `${i + 7}:00`), ...slots.value])]
  .sort((a, b) => Number(a.replace(':', '.')) - Number(b.replace(':', '.'))))

const busy = ref(false)
const error = ref('')
async function save() {
  error.value = ''
  const priceNaira = Number(price.value.replace(/[^\d]/g, ''))
  if (!weekdays.value.length) return (error.value = 'Choose at least one day.')
  if (!slots.value.length) return (error.value = 'Choose at least one time.')
  if (slots.value.length > 12) return (error.value = 'Up to 12 times.')
  if (!services.value.length) return (error.value = 'Choose at least one service.')
  if (services.value.length > 12) return (error.value = 'Up to 12 services.')
  busy.value = true
  error.value = (await dash.saveProfile({
    person: person.value,
    areas: areas.value,
    about: about.value,
    hours: hours.value,
    priceFrom: Number.isFinite(priceNaira) ? priceNaira : 0,
    homeVisits: homeVisits.value,
    takingBookings: takingBookings.value,
    weekdays: weekdays.value.map(Number),
    slots: slots.value,
    services: services.value,
    slotCapacity: Math.min(20, Math.max(1, Number(capacity.value) || 1)),
  })) ?? ''
  busy.value = false
  if (!error.value) useNotify().success({ kicker: 'Your listing', meta: 'Saved', title: 'Listing updated', text: 'Buyers see the changes on your page now.' })
}
const capacityOptions = [1, 2, 3, 4, 5, 6, 8, 10].map(n => ({ value: String(n), label: n === 1 ? '1 client at a time' : `${n} clients at a time` }))
const field = 'h-11 border-line-strong bg-surface'
</script>

<template>
  <div v-if="listing" class="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
    <div class="flex flex-col gap-10">
    <form class="flex flex-col gap-6" novalidate @submit.prevent="save">
      <section class="flex flex-col gap-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
        <h2 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">What buyers read</h2>
        <div class="grid gap-5 sm:grid-cols-2">
          <FieldShell label="Person in charge" for="pl-person" optional hint="Who buyers will deal with.">
            <Input id="pl-person" v-model="person" maxlength="80" placeholder="Dr. Halima Sani" :class="field" />
          </FieldShell>
          <FieldShell label="Price from" for="pl-price" hint="Your lowest price, in naira.">
            <InputGroup class="h-11 border-line-strong bg-surface">
              <InputGroupAddon>₦</InputGroupAddon>
              <InputGroupInput id="pl-price" v-model="price" inputmode="numeric" placeholder="15000" />
            </InputGroup>
          </FieldShell>
          <FieldShell label="Areas you cover" for="pl-areas" optional>
            <Input id="pl-areas" v-model="areas" maxlength="120" placeholder="Abuja and environs" :class="field" />
          </FieldShell>
          <FieldShell label="Opening hours" for="pl-hours" optional>
            <Input id="pl-hours" v-model="hours" maxlength="120" placeholder="Mon–Fri, 8am–6pm. Emergencies by phone." :class="field" />
          </FieldShell>
        </div>
        <FieldShell label="About" for="pl-about" optional hint="What you do best with guard dogs and large breeds, and what a first visit looks like.">
          <Textarea id="pl-about" v-model="about" rows="4" maxlength="800" class="border-line-strong bg-surface" />
        </FieldShell>
      </section>

      <section class="flex flex-col gap-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
        <h2 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Bookings</h2>
        <label class="flex items-center gap-3 text-sm"><Switch v-model="takingBookings" />Taking bookings on Dogeash</label>
        <label class="flex items-center gap-3 text-sm"><Switch v-model="homeVisits" />I visit dogs at home</label>
        <FieldShell label="Days you take bookings">
          <ToggleGroup v-model="weekdays" type="multiple" variant="chip" aria-label="Days you take bookings" class="flex w-auto flex-wrap justify-start gap-2">
            <ToggleGroupItem v-for="d in dayOptions" :key="d.value" :value="d.value" class="rounded-full!">{{ d.label }}</ToggleGroupItem>
          </ToggleGroup>
        </FieldShell>
        <FieldShell label="Times" hint="When an appointment can start. Up to 12.">
          <ToggleGroup v-model="slots" type="multiple" variant="chip" aria-label="Times" class="flex w-auto flex-wrap justify-start gap-2">
            <ToggleGroupItem v-for="t in timeOptions" :key="t" :value="t" class="rounded-full! font-mono">{{ t }}</ToggleGroupItem>
          </ToggleGroup>
        </FieldShell>
        <FieldShell label="Clients per time" for="pl-capacity" hint="How many bookings one time can take. Once it's full, buyers see that time as booked.">
          <SelectMenu id="pl-capacity" v-model="capacity" :options="capacityOptions" class="h-11! sm:w-[220px]" />
        </FieldShell>
      </section>

      <section class="flex flex-col gap-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
        <div class="flex flex-col gap-1">
          <h2 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">What you offer</h2>
          <p class="m-0 text-[13px] leading-5 text-ink-muted">Choose every service you provide, from any kind of care (up to 12). Buyers choose one when they book, and find you by them.</p>
        </div>
        <FieldShell v-for="g in careServiceGroups" :key="g.type" :label="g.label">
          <ToggleGroup v-model="services" type="multiple" variant="chip" :aria-label="g.label" class="flex w-auto flex-wrap justify-start gap-2">
            <ToggleGroupItem v-for="sv in g.services" :key="sv" :value="sv" class="rounded-full!">{{ sv }}</ToggleGroupItem>
          </ToggleGroup>
        </FieldShell>
      </section>

      <p v-if="error" class="m-0 font-semibold text-danger" role="alert">{{ error }}</p>
      <div><Button type="submit" variant="marigold" class="h-11" :loading="busy">Save changes</Button></div>
    </form>
    <ProviderDetailsForm />
    </div>

    <aside class="flex flex-col gap-3 self-start rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
      <h2 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Kept by Dogeash</h2>
      <p class="m-0 text-[13px] leading-5 text-ink-muted">Dogeash checks these, so only Dogeash changes them. Ask Dogeash if one is wrong.</p>
      <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt class="text-ink-muted">Name</dt><dd class="m-0 font-semibold">{{ listing.name }}</dd>
        <dt class="text-ink-muted">Type</dt><dd class="m-0">{{ careTypes[listing.type].label }}</dd>
        <dt class="text-ink-muted">City</dt><dd class="m-0">{{ listing.city }}</dd>
        <dt class="text-ink-muted">Credential</dt><dd class="m-0">{{ listing.credential || '—' }}</dd>
        <dt class="text-ink-muted">Badge</dt>
        <dd class="m-0 flex items-center gap-1.5"><BadgeCheck v-if="listing.verified" class="size-4 text-marigold" aria-hidden="true" />{{ listing.verified ? 'Checked by Dogeash' : 'Not checked yet' }}</dd>
      </dl>
    </aside>
  </div>
  <ListSkeleton v-else :rows="2" label="Loading your listing" />
</template>
