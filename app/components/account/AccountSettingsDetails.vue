<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref } from 'vue'
import { useNotify } from '~/composables/useNotify'
import { useProfile } from '~/composables/useProfile'
import { useSession } from '~/composables/useSession'
import { accountDetailsSchema, formatNigerianPhone, localPhoneDigits } from '~/utils/auth'
import { authFields } from '~/utils/authFields'

// Settings: name, phone and city. The email is shown but changed separately (it needs confirming).
const { user } = useSession()
const { save } = useProfile()
const notify = useNotify()

const { handleSubmit } = useForm({ validationSchema: toTypedSchema(accountDetailsSchema) })
const fields = computed(() => [
  { ...authFields.fullName(), defaultValue: user.value?.name ?? '' },
  { ...authFields.phone('Stores you book with use it to confirm visits. It\'s never shown publicly.'), defaultValue: localPhoneDigits(user.value?.phone ?? '') },
  { ...authFields.city(), optional: true, defaultValue: user.value?.city ?? '' },
])
const busy = ref(false)
const error = ref('')

const submit = handleSubmit(async (v) => {
  busy.value = true
  error.value = (await save({ full_name: v.fullName.trim(), phone: formatNigerianPhone(v.phone), city: v.city?.trim() || null })) ?? ''
  busy.value = false
  if (!error.value) notify.success({ kicker: 'Settings', meta: 'Saved', title: 'Details updated', text: 'Stores you book with will see the new details.' })
})
</script>

<template>
  <SectionPanel title="Your details">
    <form class="flex flex-col gap-5 p-3" method="post" novalidate @submit.prevent="submit">
      <Fields :fields="fields" />
      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-bold">Email</span>
        <span class="text-[15px]">{{ user?.email }}</span>
        <span class="text-[13px] text-ink-muted">You sign in with this. Changing it is coming soon.</span>
      </div>
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <Button type="submit" class="w-fit" :loading="busy">Save details</Button>
    </form>
  </SectionPanel>
</template>
