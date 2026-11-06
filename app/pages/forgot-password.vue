<script setup lang="ts">
import { LogIn, Search } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { AuthLinkCard } from '~/components/auth/AuthLinkCards.vue'
import { computed, ref, watch } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useAuth } from '~/composables/useAuth'
import { emailCodeSchema, newPasswordSchema } from '~/utils/auth'
import { authFields } from '~/utils/authFields'

// Reset a password: email, the 6-digit code we send, a new password, done.
// The code signs you in, so the new password is saved to your account straight away.
definePageMeta({
  layout: 'auth',
  authPanel: {
    variant: 'night',
    title: 'Back on',
    outline: 'watch.',
    text: 'We\'ll email you a code. Your shortlist, bookings and dogs are waiting where you left them.',
  },
})
useSeoMeta({ title: 'Reset your password · Dogeash', robots: 'noindex' })

const step = ref<'email' | 'code' | 'password' | 'done'>('email')
const email = ref('')
const showPassword = ref(false)
const auth = useAuth()
const busy = ref(false)
const error = ref('')

// One form; its rules follow the step (the email first, later the new password)
const { handleSubmit, values } = useForm<{ email?: string, password?: string }>({
  validationSchema: computed(() => toTypedSchema(step.value === 'password' ? newPasswordSchema : emailCodeSchema)),
})

const fields = computed(() => step.value === 'password'
  ? [authFields.password({ visible: showPassword.value, isNew: true, label: 'New password' })]
  : [authFields.email()])

// Saved before the step changes: the form forgets values once their fields leave the screen
const submit = handleSubmit(async () => {
  busy.value = true
  if (step.value === 'email') {
    email.value = values.email ?? ''
    error.value = (await auth.sendResetCode(email.value)) ?? ''
    if (!error.value) step.value = 'code'
  }
  else {
    error.value = (await auth.setPassword(values.password ?? '')) ?? ''
    if (!error.value) step.value = 'done'
  }
  busy.value = false
})
watch(values, () => { error.value = '' })

const nextSteps: AuthLinkCard[] = [
  { to: '/', title: 'Carry on', text: 'You\'re signed in. Use the new password next time.', icon: LogIn },
  { to: '/dogs', title: 'Find a guard dog', text: 'Browse dogs from inspected kennels.', icon: Search },
]
</script>

<template>
  <template v-if="step === 'email'">
    <AuthHeading title="Reset your" outline="password" text="Enter the email you signed up with and we'll send you a 6-digit code." />
    <form class="flex flex-col gap-5" method="post" novalidate @submit.prevent="submit">
      <Fields :fields="fields" />
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <Button type="submit" class="h-12 w-full" :loading="busy">{{ busy ? 'Sending…' : 'Send code' }}</Button>
    </form>
    <div class="flex flex-col gap-4 border-t border-line pt-6">
      <HelpPanel title="Signed up with a phone number?">
        Sign-in by text message is coming soon. For now, accounts sign in with email.
      </HelpPanel>
      <p class="m-0 text-sm text-ink-muted">
        Remembered it? <NuxtLink to="/sign-in" class="font-bold text-ink">Back to sign in</NuxtLink>
      </p>
    </div>
  </template>

  <AuthCodeStep
    v-else-if="step === 'code'"
    title="Check your"
    :destination="email"
    submit-label="Verify code"
    :verify="code => auth.confirmResetCode(email, code)"
    :resend="() => auth.sendResetCode(email)"
    @verified="step = 'password'"
    @back="step = 'email'"
  />

  <template v-else-if="step === 'password'">
    <AuthHeading title="Choose a new" outline="password" text="At least 8 characters with a number. You'll use it the next time you sign in." />
    <form class="flex flex-col gap-5" method="post" novalidate @submit.prevent="submit">
      <Fields :fields="fields">
        <template #password:append-icon>
          <AuthPasswordToggle v-model="showPassword" />
        </template>
      </Fields>
      <AuthPasswordStrength :password="values.password" class="-mt-2" />
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <Button type="submit" class="h-12 w-full" :loading="busy">{{ busy ? 'Saving…' : 'Save new password' }}</Button>
    </form>
  </template>

  <template v-else>
    <AuthHeading title="Password" outline="changed" done text="Your new password is saved, and you're signed in." />
    <AuthLinkCards :items="nextSteps" />
  </template>
</template>
