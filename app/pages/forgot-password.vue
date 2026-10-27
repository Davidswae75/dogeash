<script setup lang="ts">
import { LogIn, Search } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { AuthLinkCard } from '~/components/auth/AuthLinkCards.vue'

// Reset a password: email, the 6-digit code we send, a new password, done.
// Accounts aren't connected yet, so no email is sent and nothing is changed.
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
const notify = useNotify()

// One form; its rules follow the step (the email first, later the new password)
const { handleSubmit, values } = useForm<{ email?: string, password?: string }>({
  validationSchema: computed(() => toTypedSchema(step.value === 'password' ? newPasswordSchema : emailCodeSchema)),
})

const fields = computed(() => step.value === 'password'
  ? [authFields.password({ visible: showPassword.value, isNew: true, label: 'New password' })]
  : [authFields.email()])

// Saved before the step changes: the form forgets values once their fields leave the screen
const submit = handleSubmit(() => {
  if (step.value === 'email') {
    email.value = values.email ?? ''
    step.value = 'code'
  }
  else step.value = 'done'
}, ({ errors }) => notify.formErrors(errors))

const nextSteps: AuthLinkCard[] = [
  { to: '/sign-in', title: 'Sign in', text: 'Use your email and the new password.', icon: LogIn },
  { to: '/dogs', title: 'Keep browsing', text: 'Find a guard dog without signing in.', icon: Search },
]
</script>

<template>
  <template v-if="step === 'email'">
    <AuthHeading title="Reset your" outline="password" text="Enter the email you signed up with and we'll send you a 6-digit code." />
    <form class="flex flex-col gap-5" method="post" novalidate @submit.prevent="submit">
      <Fields :fields="fields" />
      <Button type="submit" class="h-12 w-full">Send code</Button>
    </form>
    <div class="flex flex-col gap-4 border-t border-line pt-6">
      <HelpPanel title="Signed up with a phone number?">
        You don't need a password. Choose "Phone number" on the sign-in page and we'll text you a code.
      </HelpPanel>
      <p class="m-0 text-sm text-ink-muted">
        Remembered it? <NuxtLink to="/sign-in" class="font-bold text-ink">Back to sign in</NuxtLink>
      </p>
    </div>
  </template>

  <AuthCodeStep v-else-if="step === 'code'" title="Check your" :destination="email" submit-label="Verify code" @verified="step = 'password'" @back="step = 'email'" />

  <template v-else-if="step === 'password'">
    <AuthHeading title="Choose a new" outline="password" text="At least 8 characters with a number. You'll use it the next time you sign in." />
    <form class="flex flex-col gap-5" method="post" novalidate @submit.prevent="submit">
      <Fields :fields="fields">
        <template #password:append-icon>
          <AuthPasswordToggle v-model="showPassword" />
        </template>
      </Fields>
      <AuthPasswordStrength :password="values.password" class="-mt-2" />
      <Button type="submit" class="h-12 w-full">Save new password</Button>
    </form>
  </template>

  <template v-else>
    <AuthHeading title="Password" outline="changed" done text="This is a preview: accounts aren't connected yet, so nothing was changed. On the live site you could sign in with it now." />
    <AuthLinkCards :items="nextSteps" />
  </template>
</template>
