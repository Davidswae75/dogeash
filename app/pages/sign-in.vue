<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { definePageMeta, useRoute, useSeoMeta } from '#imports' // nuxt
import type { AuthLinkCard } from '~/components/auth/AuthLinkCards.vue'
import { useAuth } from '~/composables/useAuth'
import { useSession } from '~/composables/useSession'
import { useStaff } from '~/composables/useStaff'
import { savedDogsMovedText } from '~/utils/account'
import { emailSignInSchema, safeRedirect } from '~/utils/auth'
import { authFields } from '~/utils/authFields'
import { signInNextSteps } from '~/utils/signInNextSteps'

// One sign-in for everyone: buyers, stores, care providers and Dogeash staff.
// Email and password, or a 6-digit code by email. Afterwards, a choice of where to go that fits the
// account: back to what they were doing, the admin console for staff, their store for store teams, and
// browsing, the shortlist or the account for everyone (utils/signInNextSteps).
definePageMeta({
  layout: 'auth',
  authPanel: {
    variant: 'night',
    title: 'Always on',
    outline: 'watch.',
    text: 'Every dog on Dogeash comes from a kennel we have visited in person.',
  },
})
useSeoMeta({ title: 'Sign in · Dogeash', robots: 'noindex' })

const route = useRoute()
const auth = useAuth()
const session = useSession()

const step = ref<'credentials' | 'code' | 'next'>('credentials')
// Which code we're waiting for: a sign-in code, or the confirmation for an account not yet confirmed
const codeFor = ref<'sign-in' | 'confirm'>('sign-in')
const email = ref('')
const showPassword = ref(false)
const busy = ref(false)
const error = ref('')

const { handleSubmit, values, validateField } = useForm<{ email?: string, password?: string }>({
  validationSchema: toTypedSchema(emailSignInSchema),
})
const fields = computed(() => [authFields.email(), authFields.password({ visible: showPassword.value })])
watch(values, () => { error.value = '' })

// Signed in: work out what this account can open (staff is checked fresh), then offer the choices.
// The button's spinner covers the wait, so no full-screen loader here.
const nextSteps = ref<AuthLinkCard[]>([])
const moved = ref(0)
async function finish(movedDogs: number) {
  const staff = useStaff()
  await staff.load()
  nextSteps.value = signInNextSteps({
    redirect: route.query.redirect ? safeRedirect(route.query.redirect) : undefined,
    stores: session.memberships.value,
    providers: session.providers.value,
    staffRole: staff.role.value,
  })
  moved.value = movedDogs
  step.value = 'next'
}

// Saved before the step changes: the form forgets values once their fields leave the screen
const submit = handleSubmit(async (v) => {
  busy.value = true
  email.value = v.email ?? ''
  const result = await auth.signIn(email.value, v.password ?? '')
  busy.value = false
  if (result.error) return (error.value = result.error)
  if (result.needsCode) {
    codeFor.value = 'confirm'
    step.value = 'code'
    return
  }
  await finish(result.moved)
})

// "Email me a code" only needs a valid email, not the password
async function emailCode() {
  if (!(await validateField('email')).valid) return
  busy.value = true
  email.value = values.email ?? ''
  error.value = (await auth.sendSignInCode(email.value)) ?? ''
  busy.value = false
  if (error.value) return
  codeFor.value = 'sign-in'
  step.value = 'code'
}

async function verifyCode(code: string) {
  const result = codeFor.value === 'confirm' ? await auth.confirmSignUp(email.value, code) : await auth.confirmSignInCode(email.value, code)
  if (!result.error) await finish(result.moved)
  return result.error
}
const resendCode = () => (codeFor.value === 'confirm' ? auth.resendSignUpCode(email.value) : auth.sendSignInCode(email.value))
</script>

<template>
  <template v-if="step === 'credentials'">
    <AuthHeading title="Sign" outline="in" text="One account for buying, running a store and booking on Dogeash." />

    <!-- method="post" keeps typed values out of the URL if someone submits before the page loads -->
    <form class="flex flex-col gap-5" method="post" novalidate @submit.prevent="submit">
      <Fields :fields="fields">
        <template #password:append-icon>
          <AuthPasswordToggle v-model="showPassword" />
        </template>
      </Fields>
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <Button type="submit" class="h-12 w-full" :loading="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</Button>
      <button type="button" class="cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-ink underline underline-offset-4" :disabled="busy" @click="emailCode">
        Email me a sign-in code instead
      </button>
    </form>

    <div class="flex flex-col gap-4 border-t border-line pt-6">
      <HelpPanel title="Run a store on Dogeash?">
        Sign in here with the account you used to apply. Your store dashboard is the first choice after.
      </HelpPanel>
      <p class="m-0 text-sm text-ink-muted">
        New here? <NuxtLink to="/sign-up" class="font-bold text-ink">Create an account</NuxtLink> or <NuxtLink to="/open-a-store" class="font-bold text-ink">open a store</NuxtLink>.
        Sign-in by text message is coming soon.
      </p>
    </div>
  </template>

  <template v-else-if="step === 'next'">
    <AuthHeading title="Welcome back," :outline="session.firstName.value || 'friend'" done :text="`${savedDogsMovedText(moved)} Where would you like to go?`.trim()" />
    <AuthLinkCards :items="nextSteps" />
  </template>

  <AuthCodeStep
    v-else
    :title="codeFor === 'confirm' ? 'Confirm with your' : 'Enter your'"
    :destination="email"
    :submit-label="codeFor === 'confirm' ? 'Confirm and sign in' : 'Verify and sign in'"
    :verify="verifyCode"
    :resend="resendCode"
    @back="step = 'credentials'"
  />
</template>
