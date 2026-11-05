<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref, watch } from 'vue'
import { z } from 'zod'
import type { FieldConfig } from '~/components/Fields.vue'
import type { ProviderDraft } from '~/composables/useAdminCare'
import type { CareProvider, CareType } from '~/utils/care'
import { careTypes } from '~/utils/care'

// Add or edit a care provider in the directory. `save` returns an error, or null to close.
const props = defineProps<{ provider?: CareProvider, save: (p: ProviderDraft) => Promise<string | null> }>()
const open = defineModel<boolean>('open', { default: false })

const schema = z.object({
  name: z.string().trim().min(2, 'Give the provider a name').max(80),
  person: z.string().trim().max(80).default(''),
  type: z.enum(Object.keys(careTypes) as [CareType, ...CareType[]], { message: 'Choose what they do' }),
  city: z.string().trim().min(2, 'Which city?').max(60),
  areas: z.string().trim().max(120).default(''),
  credential: z.string().trim().max(120).default(''),
  priceFrom: z.coerce.number({ message: 'Price in naira, like 15000' }).int().min(0).max(100_000_000),
  homeVisits: z.boolean(),
  verified: z.boolean(),
})
type Values = z.infer<typeof schema>
const blank = (): Partial<Values> => ({ name: '', person: '', type: 'vet', city: '', areas: '', credential: '', priceFrom: 0, homeVisits: false, verified: false })
const fromProvider = (p: CareProvider): Values => ({ name: p.name, person: p.person ?? '', type: p.type, city: p.city, areas: p.areas, credential: p.credential, priceFrom: p.priceFrom, homeVisits: p.homeVisits, verified: p.verified })

const { handleSubmit, defineField, errors, resetForm } = useForm<Values>({ validationSchema: toTypedSchema(schema) })
const [type] = defineField('type')
const [homeVisits] = defineField('homeVisits')
const [verified] = defineField('verified')
watch(open, (o) => { if (o) { resetForm({ values: props.provider ? fromProvider(props.provider) : blank() }); error.value = '' } })

const input = (name: keyof Values, label: string, placeholder: string, extra: Partial<FieldConfig> = {}): FieldConfig =>
  ({ fieldType: 'input', name, label, attrs: { placeholder, ...extra.attrs }, ...extra } as FieldConfig)
const fields = {
  who: [input('name', 'Name', 'Kuje Veterinary Clinic'), input('person', 'Person', 'Dr. Halima Sani', { hint: 'Optional. Who buyers will deal with.' })],
  where: [input('city', 'City', 'Abuja'), input('areas', 'Areas covered', 'Abuja and environs')],
  more: [input('credential', 'Credential', 'VCN registered veterinary surgeon'), input('priceFrom', 'Price from', '15000', { prefix: '₦', attrs: { inputmode: 'numeric' } })],
}

const busy = ref(false)
const error = ref('')
const submit = handleSubmit(async (v) => {
  busy.value = true
  error.value = (await props.save({ ...v, id: props.provider?.id })) ?? ''
  busy.value = false
  if (!error.value) open.value = false
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[92dvh] overflow-y-auto sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ props.provider ? `Edit ${props.provider.name}` : 'Add a care provider' }}</DialogTitle>
        <DialogDescription>Providers show in the public care directory, and stores can add them to their care team.</DialogDescription>
      </DialogHeader>
      <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
        <div class="grid gap-5 sm:grid-cols-2"><Fields :fields="fields.who.slice(0, 1)" /><Fields :fields="fields.who.slice(1)" /></div>
        <FieldShell label="What they do" for="provider-type" :error="errors.type">
          <NativeSelect id="provider-type" v-model="type" class="h-11 w-full">
            <NativeSelectOption v-for="(t, key) in careTypes" :key="key" :value="key">{{ t.label }}</NativeSelectOption>
          </NativeSelect>
        </FieldShell>
        <div class="grid gap-5 sm:grid-cols-2"><Fields :fields="fields.where.slice(0, 1)" /><Fields :fields="fields.where.slice(1)" /></div>
        <div class="grid gap-5 sm:grid-cols-2"><Fields :fields="fields.more.slice(0, 1)" /><Fields :fields="fields.more.slice(1)" /></div>
        <label class="flex items-center gap-3 text-sm"><Switch v-model="homeVisits" />Visits clients at home</label>
        <label class="flex items-center gap-3 text-sm"><Switch v-model="verified" />Checked by Dogeash <span class="text-ink-muted">(shows the "verified" badge)</span></label>
        <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
        <DialogFooter>
          <Button type="button" variant="ghost" :disabled="busy" @click="open = false">Cancel</Button>
          <Button type="submit" variant="marigold" :loading="busy">{{ props.provider ? 'Save changes' : 'Add provider' }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
