<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

// Sign-in and sign-up: logo and a way back, the page's form on the left, the brand panel on the right.
// Pages describe their panel with definePageMeta({ layout: 'auth', authPanel: { … } }).
const route = useRoute()
const panel = computed(() => route.meta.authPanel)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-canvas">
    <header class="flex h-header items-center justify-between px-4 sm:px-8">
      <AppLogo />
      <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink">
        <ArrowLeft class="size-4" aria-hidden="true" />Back to Dogeash
      </NuxtLink>
    </header>
    <main id="main" class="grid flex-1 lg:grid-cols-2">
      <section class="flex items-center justify-center px-4 py-10 sm:px-8">
        <div class="flex w-full max-w-[440px] animate-rise flex-col gap-7">
          <slot />
        </div>
      </section>
      <AuthPanel v-if="panel" :panel="panel" />
    </main>
  </div>
</template>
