<script setup lang="ts">
import { Undo2 } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { AuthLinkCard } from '~/components/auth/AuthLinkCards.vue'
import { computed, ref, watch } from 'vue'
import { definePageMeta, useRoute, useSeoMeta } from '#imports' // nuxt
import { useSupabaseClient } from '#imports' // @nuxtjs/supabase
import { useAuth } from '~/composables/useAuth'
import { useAuthPanel } from '~/composables/useAuthPanel'
import { useInviteLink } from '~/composables/useInviteLink'
import { useSession } from '~/composables/useSession'
import { useStoreApi } from '~/composables/useStoreApi'
import { firstNameOf, savedDogsMovedText } from '~/utils/account'
import { formatNigerianPhone, safeRedirect, signUpSchema, storeSignUpSchema } from '~/utils/auth'
import { authFields } from '~/utils/authFields'
import { findSignUpIntent, signUpIntents } from '~/utils/signUpIntents'
import type { SignUpIntent } from '~/utils/signUpIntents'

// Create an account: what brings you here, details, confirm the email with a 6-digit code, then a welcome.
// "Open a store" (/sign-up?as=store) asks for the kennel's name and city too, creates the store as a draft
// once the email is confirmed, and changes the copy and panel.
// From an invitation email (?invite=…&kind=provider|store): the page says what's being accepted (to manage a
// care listing, or to join a store's team) instead of asking, the invited email is filled in and fixed, and
// the invitation is accepted once the email is confirmed, so the welcome leads straight to the dashboard.
definePageMeta({
  layout: 'auth',
  authPanel: {
    variant: 'day',
    title: 'A guardian',
    outline: 'for your gate.',
    text: 'Trained, health-checked guard dogs from kennels we inspect in person, with handover training at your home.',
  },
})
useSeoMeta({ title: 'Create an account · Dogeash', robots: 'noindex' })

const route = useRoute()
const step = ref<'details' | 'code' | 'welcome'>('details')
const showPassword = ref(false)
const intentValue = ref<SignUpIntent>(findSignUpIntent(route.query.as).value)
// ToggleGroup emits an empty value when the chosen chip is clicked again; keep the current choice
const intentModel = computed({
  get: () => intentValue.value,
  set: (v) => { if (v) intentValue.value = v },
})
const intent = computed(() => findSignUpIntent(intentValue.value))

const invite = await useInviteLink()
const inviteCopy = invite.copy
// An invited person is joining something that exists: no store of their own to open here
if (inviteCopy.value) intentValue.value = 'buy'
const inviteError = ref('')

// Sent here from a gated action ("Sign in to message …"): the welcome leads straight back to it
const redirect = route.query.redirect ? safeRedirect(route.query.redirect) : undefined
const nextSteps = computed<AuthLinkCard[]>(() => inviteCopy.value && !inviteError.value
  ? inviteCopy.value.nextSteps
  : redirect && !isStore.value
  ? [{ to: redirect, title: 'Carry on where you were', text: 'Back to the page you were on, to finish what you started.', icon: Undo2 }, ...intent.value.nextSteps.slice(0, 2)]
  : intent.value.nextSteps)
const isStore = computed(() => intent.value.value === 'store')
// Always set, so a broken invitation link falls back to the usual panel rather than the layout's invitation one
useAuthPanel(() => inviteCopy.value?.panel ?? intent.value.panel ?? route.meta.authPanel)

const account = ref({ name: '', email: '', phone: '', storeName: '', city: '' })
const firstName = computed(() => firstNameOf(account.value.name))
const auth = useAuth()
const busy = ref(false)
const error = ref('')

const { handleSubmit, values } = useForm({
  validationSchema: computed(() => toTypedSchema(isStore.value ? storeSignUpSchema : signUpSchema)),
})

const fields = computed(() => [
  authFields.fullName(isStore.value ? 'The owner or manager of the kennel.' : undefined),
  ...(isStore.value ? [authFields.storeName(), authFields.city()] : []),
  // From an invitation: the invited address, fixed (the invitation is matched to it). From ?email=…: filled in.
  invite.preview.value
    ? { ...authFields.email(), defaultValue: invite.preview.value.email, attrs: { ...authFields.email().attrs, readonly: true }, hint: 'The address the invitation was sent to.' }
    : { ...authFields.email(), defaultValue: typeof route.query.email === 'string' ? route.query.email.slice(0, 254) : undefined },
  authFields.phone(isStore.value
    ? 'Dogeash uses it to reach you about your store. Buyers contact you through Dogeash, not this number.'
    : 'Stores you book with use it to confirm visits. It\'s never shown publicly.'),
  authFields.password({ visible: showPassword.value, isNew: true }),
])

// Saved before the step changes: the form forgets values once their fields leave the screen
const submit = handleSubmit(async (v) => {
  account.value = {
    name: v.fullName,
    email: v.email,
    phone: formatNigerianPhone(v.phone),
    storeName: 'storeName' in v ? String(v.storeName) : '',
    city: 'city' in v ? String(v.city) : '',
  }
  busy.value = true
  error.value = (await auth.signUp(v.email, v.password, v.fullName)) ?? ''
  busy.value = false
  if (!error.value) step.value = 'code'
})
watch(values, () => { error.value = '' })

// The code confirms the email and signs you in. Then: phone (and city) on the profile, the draft store
// for "Open a store", and this browser's saved dogs carried into the account.
const session = useSession()
const supabase = useSupabaseClient()
const stores = useStoreApi()
// Shown on the welcome: dogs carried over from this browser, or the draft store that didn't save
const moved = ref(0)
const storeError = ref('')

// The code step's button keeps spinning until all of this is done, so no full-screen loader here
async function confirm(code: string) {
  const result = await auth.confirmSignUp(account.value.email, code)
  if (result.error) return result.error
  const id = session.user.value?.id
  if (id) await supabase.from('profiles').update({ phone: account.value.phone, ...(account.value.city ? { city: account.value.city } : {}) }).eq('id', id)
  if (isStore.value) storeError.value = (await stores.createDraftStore(account.value.storeName, account.value.city)) ?? ''
  await session.load()
  if (inviteCopy.value) inviteError.value = (await invite.accept()) ?? ''
  moved.value = result.moved
  step.value = 'welcome'
  return null
}
</script>

<template>
  <template v-if="step === 'details'">
    <template v-if="inviteCopy">
      <AuthHeading :title="inviteCopy.heading.title" :outline="inviteCopy.heading.outline" :text="inviteCopy.heading.text" />
      <AuthInviteCard :card="inviteCopy.card" not-you="/sign-up" />
    </template>
    <AuthHeading v-else :title="intent.heading.title" :outline="intent.heading.outline" :text="intent.heading.text" />

    <div v-if="!inviteCopy" class="flex flex-col gap-2.5">
      <span id="intent-label" class="text-sm font-bold">What brings you here?</span>
      <ToggleGroup v-model="intentModel" type="single" variant="chip" aria-labelledby="intent-label" class="flex w-auto flex-wrap justify-start gap-2">
        <ToggleGroupItem v-for="i in signUpIntents" :key="i.value" :value="i.value" class="rounded-full!">
          <component :is="i.icon" aria-hidden="true" />{{ i.label }}
        </ToggleGroupItem>
      </ToggleGroup>
      <span v-if="isStore" class="text-[13px] text-ink-muted">
        One account does both: you can still buy and book with it. <NuxtLink to="/open-a-store" class="font-bold text-ink">How stores are verified</NuxtLink>
      </span>
    </div>

    <!-- method="post" keeps typed values out of the URL if someone submits before the page loads -->
    <form class="flex flex-col gap-5" method="post" novalidate @submit.prevent="submit">
      <Fields :fields="fields">
        <template #password:append-icon>
          <AuthPasswordToggle v-model="showPassword" />
        </template>
      </Fields>
      <AuthPasswordStrength :password="values.password" class="-mt-2" />
      <CheckboxField name="terms">
        I agree to the <NuxtLink to="/terms" class="font-bold text-ink">terms of use</NuxtLink> and the <NuxtLink to="/privacy" class="font-bold text-ink">privacy policy</NuxtLink>.
      </CheckboxField>
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <Button type="submit" class="h-12 w-full" :loading="busy">{{ busy ? 'Creating your account…' : inviteCopy?.submitLabel ?? intent.submitLabel }}</Button>
    </form>

    <p class="m-0 border-t border-line pt-6 text-sm text-ink-muted">
      Already have an account? <NuxtLink :to="{ path: '/sign-in', query: invite.query }" class="font-bold text-ink">Sign in{{ inviteCopy ? ' to accept' : '' }}</NuxtLink>
    </p>
  </template>

  <AuthCodeStep
    v-else-if="step === 'code'"
    title="Confirm with your"
    :destination="account.email"
    :submit-label="isStore ? 'Confirm and start my store' : 'Confirm and create account'"
    :verify="confirm"
    :resend="() => auth.resendSignUpCode(account.email)"
    @back="step = 'details'"
  />

  <template v-else>
    <AuthHeading title="Welcome," :outline="firstName" done :text="storeError || inviteError ? 'Your account is ready.' : `${inviteCopy?.welcome ?? intent.welcome({ storeName: account.storeName })} ${savedDogsMovedText(moved)}`.trim()" />
    <p v-if="inviteError" class="m-0 rounded-lg bg-surface p-3.5 text-sm font-semibold text-danger ring-1 ring-line" role="alert">{{ inviteError }}</p>
    <!-- The account worked but the draft store didn't: say so here, where they'll see it -->
    <p v-if="storeError" class="m-0 rounded-lg bg-surface p-3.5 text-sm font-semibold text-danger ring-1 ring-line" role="alert">{{ account.storeName }} wasn't saved: {{ storeError }} Open a store from your account to try again.</p>
    <AuthLinkCards :items="nextSteps" />
  </template>
</template>
