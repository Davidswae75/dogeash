<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import type { ApplicationRow, ApplicationValues } from '~/utils/storeApplication'
import { applicationFields, applicationFromRow, applicationSchema, inspectionDayOptions } from '~/utils/storeApplication'

// Where the kennel is, how to reach the owner, which days suit the inspection, and anything Dogeash should know.
// `save` returns an error or null.
const props = defineProps<{ app: ApplicationRow | null, phone: string, locked: boolean, save: (v: ApplicationValues) => Promise<string | null> }>()

const { handleSubmit, defineField, errors, meta, resetForm } = useForm<ApplicationValues>({
  validationSchema: toTypedSchema(applicationSchema),
  initialValues: applicationFromRow(props.app, props.phone),
})
const [days] = defineField('preferredDays')
const [cacRegistered] = defineField('cacRegistered')
const [note] = defineField('note')
const options = inspectionDayOptions()
// Days chosen earlier that have passed stay visible, so they can be unticked
const dayOptions = [...(props.app?.preferred_days ?? []).filter(d => !options.some(o => o.value === d)).map(d => ({ value: d, label: new Date(`${d}T12:00:00`).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }) })), ...options]
const pick = (v: string[]) => { days.value = v.slice(0, 3) }

const busy = ref(false)
const error = ref('')
const submit = handleSubmit(async (v) => {
  busy.value = true
  error.value = (await props.save(v)) ?? ''
  busy.value = false
  if (!error.value) resetForm({ values: v })
}, () => { error.value = 'Some details need a look. They\'re marked in red.' })
</script>

<template>
  <form id="application-details" class="flex scroll-mt-24 flex-col gap-5 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6" novalidate @submit.prevent="submit">
    <h2 class="m-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">Kennel and inspection</h2>
    <fieldset :disabled="props.locked" class="m-0 flex flex-col gap-5 border-0 p-0">
      <Fields :fields="applicationFields" />
      <FieldShell label="Days that suit the inspection" hint="Choose up to three. Dogeash calls to confirm one." :error="errors.preferredDays">
        <ToggleGroup :model-value="days" type="multiple" variant="chip" aria-label="Days that suit the inspection" class="flex w-auto flex-wrap justify-start gap-2" @update:model-value="v => pick(v as string[])">
          <ToggleGroupItem v-for="d in dayOptions" :key="d.value" :value="d.value" :disabled="!days?.includes(d.value) && (days?.length ?? 0) >= 3" class="rounded-full!">{{ d.label }}</ToggleGroupItem>
        </ToggleGroup>
      </FieldShell>
      <label class="flex items-start gap-3">
        <Switch :model-value="!cacRegistered" class="mt-0.5" @update:model-value="v => (cacRegistered = !v)" />
        <span class="flex flex-col">
          <span class="text-sm font-semibold">The kennel isn't registered as a business yet</span>
          <span class="text-[13px] leading-5 text-ink-muted">Then you don't need a CAC certificate to apply. Dogeash may ask about it at the inspection.</span>
        </span>
      </label>
      <FieldShell label="Anything Dogeash should know" for="application-note" optional hint="How many dogs you keep, access to the kennel, anything special." :error="errors.note">
        <Textarea id="application-note" v-model="note" rows="3" maxlength="1000" class="border-2 border-line-strong" />
      </FieldShell>
    </fieldset>
    <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
    <div v-if="!props.locked" class="flex items-center gap-3">
      <Button type="submit" variant="marigold" :loading="busy" :disabled="!meta.dirty">Save</Button>
      <span v-if="!meta.dirty" class="text-[13px] text-ink-muted">{{ props.app ? 'Saved.' : 'Nothing saved yet.' }}</span>
    </div>
  </form>
</template>
