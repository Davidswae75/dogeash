<script setup lang="ts">
import { Undo2 } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { AuthLinkCard } from '~/components/auth/AuthLinkCards.vue'

// Create an account: what brings you here, details, confirm the phone with a code, then a welcome with next steps.
// "Open a store" (/sign-up?as=store) asks for the kennel's name and city too and changes the copy and panel.
// Accounts aren't connected yet, so nothing is saved and the welcome is a preview.
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

// Sent here from a gated action ("Sign in to message …"): the welcome leads straight back to it
const redirect = route.query.redirect ? safeRedirect(route.query.redirect) : undefined
const nextSteps = computed<AuthLinkCard[]>(() => redirect && !isStore.value
  ? [{ to: redirect, title: 'Carry on where you were', text: 'Back to the page you were on, to finish what you started.', icon: Undo2 }, ...intent.value.nextSteps.slice(0, 2)]
  : intent.value.nextSteps)
const isStore = computed(() => intent.value.value === 'store')
useAuthPanel(() => intent.value.panel)

const account = ref({ name: '', email: '', storeName: '' })
const firstName = computed(() => firstNameOf(account.value.name))
const phoneShown = ref('')

const { handleSubmit, values } = useForm({
  validationSchema: computed(() => toTypedSchema(isStore.value ? storeSignUpSchema : signUpSchema)),
})

const fields = computed(() => [
  authFields.fullName(isStore.value ? 'The owner or manager of the kennel.' : undefined),
  ...(isStore.value ? [authFields.storeName(), authFields.city()] : []),
  authFields.email(),
  authFields.phone(isStore.value
    ? 'We\'ll text you a code to confirm it. Buyers reach your store through Dogeash, not this number.'
    : 'We\'ll text you a code to confirm it. Stores use it to reach you about a dog.'),
  authFields.password({ visible: showPassword.value, isNew: true }),
])

// Saved before the step changes: the form forgets values once their fields leave the screen
const notify = useNotify()
const submit = handleSubmit((v) => {
  account.value = { name: v.fullName, email: v.email, storeName: 'storeName' in v ? String(v.storeName) : '' }
  phoneShown.value = formatNigerianPhone(v.phone)
  step.value = 'code'
}, ({ errors }) => notify.formErrors(errors))

// Confirming the code creates (a preview of) the account, signs in and carries over this browser's saved dogs
const session = useSession()
watch(step, (s) => {
  if (s !== 'welcome') return
  const moved = session.signIn({ name: account.value.name, email: account.value.email, id: `BYR-${String(Math.floor(1000 + Math.random() * 9000))}` })
  if (isStore.value) notify.storeStarted(firstName.value, account.value.storeName)
  else notify.accountCreated(firstName.value, moved)
})
</script>

<template>
  <template v-if="step === 'details'">
    <AuthHeading :title="intent.heading.title" :outline="intent.heading.outline" :text="intent.heading.text" />

    <div class="flex flex-col gap-2.5">
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
      <Button type="submit" class="h-12 w-full">{{ intent.submitLabel }}</Button>
    </form>

    <p class="m-0 border-t border-line pt-6 text-sm text-ink-muted">
      Already have an account? <NuxtLink to="/sign-in" class="font-bold text-ink">Sign in</NuxtLink>
    </p>
  </template>

  <AuthCodeStep v-else-if="step === 'code'" title="Confirm with your" :destination="phoneShown" :submit-label="isStore ? 'Confirm and start my store' : 'Confirm and create account'" @verified="step = 'welcome'" @back="step = 'details'" />

  <template v-else>
    <AuthHeading title="Welcome," :outline="firstName" done :text="intent.welcome({ storeName: account.storeName })" />
    <AuthLinkCards :items="nextSteps" />
  </template>
</template>
