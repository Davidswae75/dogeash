<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref } from 'vue'
import type { VisitSettings } from '~/utils/stores'
import { sortSlots, visitSettingsSchema, visitSlotOptions, weekdayOptions } from '~/utils/storeSettings'

// When the store takes kennel visits: days, times, home visits, and pausing requests with a note.
// The booking dialog on the store's pages offers exactly these. `save` returns an error or null.
const props = defineProps<{ settings: VisitSettings, save: (v: VisitSettings) => Promise<string | null> }>()

const { handleSubmit, defineField, errors, meta, resetForm } = useForm<VisitSettings>({
  validationSchema: toTypedSchema(visitSettingsSchema),
  initialValues: { ...props.settings, days: [...props.settings.days], slots: [...props.settings.slots] },
})
const [days] = defineField('days')
const [slots] = defineField('slots')
const [home] = defineField('home')
const [paused] = defineField('paused')
const [note] = defineField('note')

// ToggleGroup works in strings; the form keeps numbers for days
const dayModel = computed({ get: () => (days.value ?? []).map(String), set: (v: string[]) => { days.value = v.map(Number) } })
const slotModel = computed({ get: () => slots.value ?? [], set: (v: string[]) => { slots.value = sortSlots(v) } })

const busy = ref(false)
const error = ref('')
const submit = handleSubmit(async (values) => {
  busy.value = true
  error.value = (await props.save(values)) ?? ''
  busy.value = false
  if (!error.value) resetForm({ values })
}, () => { error.value = 'Some settings need a look. They\'re marked in red.' })

const section = 'flex flex-col gap-5 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6'
const heading = 'm-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded'
const chips = 'flex w-auto flex-wrap justify-start gap-2'
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
    <section :class="section" aria-labelledby="visit-times">
      <div class="flex flex-col gap-1">
        <h2 id="visit-times" :class="heading">Kennel visits</h2>
        <p class="m-0 text-[13px] leading-5 text-ink-muted">Buyers book from these days and times on your store and dog pages. You still confirm each visit in Bookings.</p>
      </div>
      <FieldShell label="Days you take visits" :error="errors.days">
        <ToggleGroup v-model="dayModel" type="multiple" variant="chip" aria-label="Days you take visits" :class="chips">
          <ToggleGroupItem v-for="d in weekdayOptions" :key="d.value" :value="String(d.value)" class="rounded-full!">{{ d.label }}</ToggleGroupItem>
        </ToggleGroup>
      </FieldShell>
      <FieldShell label="Times" hint="Up to 12. Each is when a visit starts." :error="errors.slots">
        <ToggleGroup v-model="slotModel" type="multiple" variant="chip" aria-label="Visit times" :class="chips">
          <ToggleGroupItem v-for="t in visitSlotOptions" :key="t" :value="t" class="rounded-full! font-mono text-xs">{{ t }}</ToggleGroupItem>
        </ToggleGroup>
      </FieldShell>
      <label class="flex items-start gap-3">
        <Switch v-model="home" class="mt-0.5" />
        <span class="flex flex-col">
          <span class="text-sm font-semibold">Also visit buyers at home</span>
          <span class="text-[13px] leading-5 text-ink-muted">Buyers can ask you to bring dogs to their property instead of coming to the kennel.</span>
        </span>
      </label>
    </section>

    <section :class="section" aria-labelledby="visit-pause">
      <label class="flex items-start gap-3">
        <Switch v-model="paused" class="mt-0.5" />
        <span class="flex flex-col">
          <span id="visit-pause" class="text-sm font-semibold">Pause visit requests</span>
          <span class="text-[13px] leading-5 text-ink-muted">Your store and dogs stay listed and buyers can still message you, but "Book a kennel visit" is switched off. Visits already booked aren't affected.</span>
        </span>
      </label>
      <FieldShell v-if="paused" label="Note for buyers" for="pause-note" optional hint="Shown on the paused button, like &quot;Back on 1 December&quot;." :error="errors.note">
        <Input id="pause-note" v-model="note" maxlength="200" class="h-11 border-2 border-line-strong" />
      </FieldShell>
    </section>

    <div class="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-1 py-3 backdrop-blur">
      <p v-if="error" class="m-0 w-full text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <Button type="submit" variant="marigold" :loading="busy" :disabled="!meta.dirty">Save settings</Button>
      <span v-if="!meta.dirty" class="text-[13px] text-ink-muted">No changes yet.</span>
    </div>
  </form>
</template>
