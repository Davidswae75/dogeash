<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { definePageMeta, navigateTo, useRoute, useSeoMeta } from '#imports' // nuxt
import { useStaff } from '~/composables/useStaff'

// The one-time code every admin session needs. First time: set up an authenticator app (scan the QR code
// or type the key), then confirm with a code from it. After that: just the 6-digit code.
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'One-time code · Dogeash admin', robots: 'noindex' })

const route = useRoute()
const staff = useStaff()
const mode = ref<'loading' | 'setup' | 'code'>('loading')
const factorId = ref('')
const setup = ref<{ qr: string, secret: string }>()
const code = ref('')
const busy = ref(false)
const error = ref('')

onMounted(async () => {
  const f = await staff.factor()
  if (f) {
    factorId.value = f.id
    mode.value = 'code'
  }
  else {
    mode.value = 'setup'
  }
})

async function start() {
  busy.value = true
  const result = await staff.enroll()
  busy.value = false
  if ('error' in result) return (error.value = result.error)
  factorId.value = result.id
  setup.value = { qr: result.qr, secret: result.secret }
}

async function verify() {
  if (code.value.length !== 6) return (error.value = 'Enter all 6 digits from the app.')
  busy.value = true
  error.value = (await staff.verify(factorId.value, code.value)) ?? ''
  busy.value = false
  if (error.value) return (code.value = '')
  const to = String(route.query.redirect ?? '')
  await navigateTo(to.startsWith('/admin') && to !== '/admin/verify' ? to : staff.role.value === 'inspector' ? '/admin/inspections' : '/admin')
}
</script>

<template>
  <section class="mx-auto flex max-w-[440px] flex-col gap-5 pt-10">
    <header class="flex flex-col gap-1">
      <span class="font-mono text-[11px] tracking-[.12em] text-ink-muted uppercase">One-time code</span>
      <h1 class="m-0 text-lg font-semibold">{{ mode === 'setup' ? 'Set up an authenticator app' : 'Enter your code' }}</h1>
      <p class="m-0 text-ink-muted">
        {{ mode === 'setup'
          ? 'The admin dashboard needs a code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy) each time you sign in. Set it up once.'
          : 'Open your authenticator app and enter the 6-digit code for Dogeash.' }}
      </p>
    </header>

    <p v-if="mode === 'loading'" class="m-0 text-ink-muted">Checking…</p>

    <template v-else-if="mode === 'setup' && !setup">
      <Button class="w-fit" :loading="busy" @click="start">Set up</Button>
    </template>

    <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="verify">
      <div v-if="setup" class="flex flex-col gap-3 border border-line p-4">
        <span class="text-ink-muted">1. In the app, add an account and scan this code.</span>
        <img :src="setup.qr" alt="QR code for setting up the authenticator app" class="size-44 bg-white p-2">
        <span class="text-ink-muted">Can't scan? Type this key instead:</span>
        <code class="font-mono text-xs break-all select-all">{{ setup.secret }}</code>
        <span class="text-ink-muted">2. Enter the 6-digit code the app shows.</span>
      </div>
      <InputOTP v-model="code" :maxlength="6" autocomplete="one-time-code" inputmode="numeric" aria-label="6-digit code" @complete="verify">
        <InputOTPGroup class="w-full">
          <InputOTPSlot v-for="i in 6" :key="i" :index="i - 1" class="h-12 flex-1 border border-line-strong bg-surface font-mono text-lg data-[active=true]:border-ink data-[active=true]:ring-0" />
        </InputOTPGroup>
      </InputOTP>
      <p v-if="error" class="m-0 font-semibold text-danger" role="alert">{{ error }}</p>
      <Button type="submit" class="w-fit" :loading="busy">{{ setup ? 'Finish set-up' : 'Continue' }}</Button>
    </form>
  </section>
</template>
