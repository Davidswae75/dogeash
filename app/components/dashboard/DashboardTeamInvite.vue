<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { z } from 'zod'
import type { FieldConfig } from '~/components/Fields.vue'
import type { StoreRole } from '~/utils/storeRoles'
import { storeRoles } from '~/utils/storeRoles'

// Invite someone to the team: their email and a role. `invite` returns an error or null.
const props = defineProps<{ invite: (email: string, role: StoreRole) => Promise<string | null> }>()

const schema = z.object({
  email: z.string().trim().email('An email address, like name@kennel.ng').max(254),
  role: z.enum(['owner', 'manager', 'handler'], { message: 'Choose a role' }),
})
const { handleSubmit, defineField, errors, resetForm } = useForm({ validationSchema: toTypedSchema(schema), initialValues: { role: 'handler' as StoreRole } })
const [role] = defineField('role')
const fields: FieldConfig[] = [{ fieldType: 'input', name: 'email', label: 'Their email', hint: 'The email they sign in with, or will sign up with.', attrs: { type: 'email', autocomplete: 'off', placeholder: 'musa@k9guardian.ng' } } as FieldConfig]

const busy = ref(false)
const error = ref('')
const submit = handleSubmit(async (values) => {
  busy.value = true
  error.value = (await props.invite(values.email, values.role)) ?? ''
  busy.value = false
  if (!error.value) resetForm()
})
</script>

<template>
  <form class="flex flex-col gap-5 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6" novalidate @submit.prevent="submit">
    <div class="flex flex-col gap-1">
      <h2 class="m-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">Invite someone</h2>
      <p class="m-0 text-[13px] leading-5 text-ink-muted">They'll see the invitation in their Dogeash account, and a notification if they already have one. Tell them to sign in or sign up with this email.</p>
    </div>
    <Fields :fields="fields" />
    <FieldShell label="Role" :error="errors.role">
      <ToggleGroup v-model="role" type="single" variant="chip" aria-label="Role" class="flex w-auto flex-wrap justify-start gap-2">
        <ToggleGroupItem v-for="(r, key) in storeRoles" :key="key" :value="key" class="rounded-full!">{{ r.label }}</ToggleGroupItem>
      </ToggleGroup>
      <p v-if="role" class="m-0 text-[13px] leading-5 text-ink-muted">{{ storeRoles[role].label }}s can open: {{ storeRoles[role].hint.toLowerCase() }}.</p>
    </FieldShell>
    <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
    <Button type="submit" variant="marigold" class="w-fit" :loading="busy">Send invitation</Button>
  </form>
</template>
