<script setup lang="ts">
import { BookOpen, Search, Store } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { AuthLinkCard } from '~/components/auth/AuthLinkCards.vue'

// Create an account: details, confirm the phone with a code, then a welcome with next steps.
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

const step = ref<'details' | 'code' | 'welcome'>('details')
const showPassword = ref(false)
const intent = ref('buy')
const firstName = ref('')
const phoneShown = ref('')

const { handleSubmit, values } = useForm({ validationSchema: toTypedSchema(signUpSchema) })

const fields = computed(() => [
  authFields.fullName(),
  authFields.email(),
  authFields.phone('We\'ll text you a code to confirm it. Stores use it to reach you about a dog.'),
  authFields.password({ visible: showPassword.value, isNew: true }),
])

// Saved before the step changes: the form forgets values once their fields leave the screen
const submit = handleSubmit((v) => {
  firstName.value = v.fullName.split(/\s+/)[0] ?? ''
  phoneShown.value = formatNigerianPhone(v.phone)
  step.value = 'code'
})

const intents = [
  { value: 'buy', label: 'Buy a guard dog', icon: Search },
  { value: 'care', label: 'Book a vet or trainer', icon: BookOpen },
]

const nextSteps: AuthLinkCard[] = [
  { to: '/dogs', title: 'Find a guard dog', text: 'Browse dogs from inspected kennels by protection level and city.', icon: Search },
  { to: '/guide', title: 'Read the buyer\'s guide', text: 'What a guard dog does for your home, what it costs, and the risks.', icon: BookOpen },
  { to: '/stores', title: 'Meet the stores', text: 'Every kennel, its owner, its history and its vets.', icon: Store },
]
</script>

<template>
  <template v-if="step === 'details'">
    <AuthHeading title="Create an" outline="account" text="Save dogs, message stores and book kennel visits. Free, and it takes a minute." />

    <div class="flex flex-col gap-2.5">
      <span id="intent-label" class="text-sm font-bold">What brings you here?</span>
      <ToggleGroup v-model="intent" type="single" variant="chip" aria-labelledby="intent-label" class="flex w-auto flex-wrap justify-start gap-2">
        <ToggleGroupItem v-for="i in intents" :key="i.value" :value="i.value" class="rounded-full!">
          <component :is="i.icon" aria-hidden="true" />{{ i.label }}
        </ToggleGroupItem>
      </ToggleGroup>
      <span class="text-[13px] text-ink-muted">Selling dogs? <NuxtLink to="/sell" class="font-bold text-ink">Apply as a store</NuxtLink> instead.</span>
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
      <Button type="submit" class="h-12 w-full">Create account</Button>
    </form>

    <p class="m-0 border-t border-line pt-6 text-sm text-ink-muted">
      Already have an account? <NuxtLink to="/sign-in" class="font-bold text-ink">Sign in</NuxtLink>
    </p>
  </template>

  <AuthCodeStep v-else-if="step === 'code'" title="Confirm with your" :destination="phoneShown" submit-label="Confirm and create account" @verified="step = 'welcome'" @back="step = 'details'" />

  <template v-else>
    <AuthHeading title="Welcome," :outline="firstName" done text="This is a preview: accounts aren't connected yet, so nothing was saved. Here's where you'd go next." />
    <AuthLinkCards :items="nextSteps" />
  </template>
</template>
