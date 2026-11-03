<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useNotify } from '~/composables/useNotify'
import { newPasswordSchema } from '~/utils/auth'
import { authFields } from '~/utils/authFields'

// Settings: choose a new password (the same rules as sign-up)
const auth = useAuth()
const notify = useNotify()

const { handleSubmit, values, resetForm } = useForm({ validationSchema: toTypedSchema(newPasswordSchema) })
const showPassword = ref(false)
const fields = computed(() => [authFields.password({ visible: showPassword.value, isNew: true, label: 'New password' })])
const busy = ref(false)
const error = ref('')

const submit = handleSubmit(async (v) => {
  busy.value = true
  error.value = (await auth.setPassword(v.password)) ?? ''
  busy.value = false
  if (error.value) return
  resetForm()
  notify.success({ kicker: 'Settings', meta: 'Saved', title: 'Password changed', text: 'Use the new password the next time you sign in.' })
}, ({ errors }) => notify.formErrors(errors))
</script>

<template>
  <SectionPanel title="Password">
    <form class="flex flex-col gap-5 p-3" method="post" novalidate @submit.prevent="submit">
      <Fields :fields="fields">
        <template #password:append-icon>
          <AuthPasswordToggle v-model="showPassword" />
        </template>
      </Fields>
      <AuthPasswordStrength :password="values.password" class="-mt-2" />
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <Button type="submit" class="w-fit" :loading="busy">Change password</Button>
    </form>
  </SectionPanel>
</template>
