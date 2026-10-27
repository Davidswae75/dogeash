<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

// Sign-in and sign-up: logo, a way back and the page's form on the left; the brand panel on the right
// stays put at full window height while the form scrolls.
// Pages describe their panel with definePageMeta({ layout: 'auth', authPanel: { … } }),
// and can swap it while open with useAuthPanel().
const route = useRoute()
const override = useAuthPanel()
const panel = computed(() => override.value ?? route.meta.authPanel)
</script>

<template>
  <div class="min-h-screen bg-canvas lg:grid lg:grid-cols-2">
    <div class="flex min-h-screen flex-col">
      <header class="flex h-header items-center justify-between px-4 sm:px-8">
        <AppLogo />
        <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink">
          <ArrowLeft class="size-4" aria-hidden="true" />Back to Dogeash
        </NuxtLink>
      </header>
      <main id="main" class="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div class="flex w-full max-w-[440px] animate-rise flex-col gap-7">
          <slot />
        </div>
      </main>
    </div>
    <AuthPanel v-if="panel" :panel="panel" />
  </div>
</template>
