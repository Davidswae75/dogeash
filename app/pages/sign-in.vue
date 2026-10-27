<script setup lang="ts">
import { LayoutDashboard, Mail, ShoppingBag, Smartphone } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { AuthLinkCard } from '~/components/auth/AuthLinkCards.vue'

// One sign-in for everyone: buyers, stores, care providers and Dogeash staff.
// Accounts aren't connected yet, so signing in ends on a preview of where each person lands.
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

const method = ref<'email' | 'phone'>('email')
const step = ref<'credentials' | 'code' | 'landing'>('credentials')
const showPassword = ref(false)
const destination = ref('')

const { handleSubmit, values, resetForm, validateField } = useForm<{ email?: string, password?: string, phone?: string }>({
  validationSchema: computed(() => toTypedSchema(method.value === 'phone' ? phoneSignInSchema : emailSignInSchema)),
})
watch(method, () => resetForm())

const fields = computed(() => method.value === 'email'
  ? [authFields.email(), authFields.password({ visible: showPassword.value })]
  : [authFields.phone()])

// Saved before the step changes: the form forgets values once their fields leave the screen
function sendCode() {
  destination.value = method.value === 'email' ? values.email ?? '' : formatNigerianPhone(values.phone ?? '')
  step.value = 'code'
}

const notify = useNotify()
const submit = handleSubmit(
  () => {
    if (method.value === 'phone') return sendCode()
    destination.value = values.email ?? ''
    step.value = 'landing'
  },
  ({ errors }) => notify.formErrors(errors),
)

// Reaching the landing signs in the sample buyer and carries this browser's saved dogs into the account
const session = useSession()
watch(step, (s) => {
  if (s !== 'landing') return
  const moved = session.signIn(method.value === 'email' && destination.value ? { email: destination.value } : {})
  notify.signedIn(session.firstName.value, moved)
})

// "Email me a code" only needs a valid email, not the password
async function emailCode() {
  if ((await validateField('email')).valid) sendCode()
}

// Where a buyer was heading before being asked to sign in (only paths on this site)
const redirect = safeRedirect(useRoute().query.redirect)

const landing: AuthLinkCard[] = [
  { to: '/dashboard', title: 'Continue as a store', text: 'Straight to the K9 Guardian Kennels dashboard', icon: LayoutDashboard },
  { to: redirect, title: 'Continue as a buyer', text: 'Back to where you were, with your shortlist and bookings', icon: ShoppingBag },
]
</script>

<template>
  <template v-if="step === 'credentials'">
    <AuthHeading title="Sign" outline="in" text="One account for buying, running a store and booking on Dogeash." />

    <ToggleGroup v-model="method" type="single" variant="watch" aria-label="Sign in with" class="inline-flex w-full gap-0.5 rounded-full bg-surface-sunk p-[3px]">
      <ToggleGroupItem value="email" class="flex-1 rounded-full!"><Mail aria-hidden="true" />Email</ToggleGroupItem>
      <ToggleGroupItem value="phone" class="flex-1 rounded-full!"><Smartphone aria-hidden="true" />Phone number</ToggleGroupItem>
    </ToggleGroup>

    <!-- method="post" keeps typed values out of the URL if someone submits before the page loads -->
    <form class="flex flex-col gap-5" method="post" novalidate @submit.prevent="submit">
      <Fields :fields="fields">
        <template #password:append-icon>
          <AuthPasswordToggle v-model="showPassword" />
        </template>
      </Fields>
      <Button type="submit" class="h-12 w-full">{{ method === 'email' ? 'Sign in' : 'Send code' }}</Button>
      <button v-if="method === 'email'" type="button" class="cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-ink underline underline-offset-4" @click="emailCode">
        Email me a sign-in code instead
      </button>
    </form>

    <div class="flex flex-col gap-4 border-t border-line pt-6">
      <HelpPanel title="Run a store on Dogeash?">
        Sign in here with the account you used to apply. Your store dashboard opens straight after.
      </HelpPanel>
      <p class="m-0 text-sm text-ink-muted">
        New here? <NuxtLink to="/sign-up" class="font-bold text-ink">Create an account</NuxtLink> or <NuxtLink to="/open-a-store" class="font-bold text-ink">open a store</NuxtLink>.
      </p>
    </div>
  </template>

  <AuthCodeStep v-else-if="step === 'code'" :destination="destination" submit-label="Verify and sign in" @verified="step = 'landing'" @back="step = 'credentials'" />

  <template v-else>
    <AuthHeading title="Signed" outline="in" done text="This is a preview: accounts aren't connected yet. On the live site you'd go straight to the right place. Choose one to see it." />
    <AuthLinkCards :items="landing" />
    <button type="button" class="w-fit cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-ink underline underline-offset-4" @click="step = 'credentials'">Start again</button>
  </template>
</template>
