<script setup lang="ts">
import type { NuxtError } from '#app'

// Every error inside the site's frame: "not found" for missing pages, a plain apology for the rest.
// The patrol chase keeps watch either way.
const props = defineProps<{ error: NuxtError }>()

const notFound = computed(() => props.error.statusCode === 404)
const message = computed(() => notFound.value
  ? 'The page you were looking for isn\'t on our patrol route. It may have moved, or the link may be wrong.'
  : 'Something went wrong on our side. Try again in a moment; if it keeps happening, the problem is ours to fix.')

useSeoMeta({ title: () => notFound.value ? 'Page not found · Dogeash' : 'Something went wrong · Dogeash', robots: 'noindex' })

const links = [
  { label: 'Find a guard dog', to: '/dogs' },
  { label: 'Protection levels', to: '/protection-levels' },
  { label: 'Stores', to: '/stores' },
  { label: 'Buyer\'s guide', to: '/guide' },
]

const goHome = () => clearError({ redirect: '/' })
const retry = () => clearError({ redirect: useRoute().fullPath })
</script>

<template>
  <NuxtLayout>
    <div :class="[homeSection, 'flex flex-col gap-5 py-8 sm:py-10']">
      <div class="h-2 rounded-full hazard" aria-hidden="true" />
      <section class="grid items-center gap-8 rounded-xl bg-surface p-6 sm:p-10 lg:grid-cols-[1fr_1fr]">
        <div class="flex animate-rise flex-col gap-5">
          <span class="font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">
            Error {{ props.error.statusCode }} · {{ notFound ? 'Off the patrol route' : 'Alarm raised' }}
          </span>
          <h1 class="m-0 mega text-[clamp(34px,4.6vw,64px)] leading-[.95]">
            <template v-if="notFound">This gate is <span class="text-outline">locked.</span></template>
            <template v-else>Something <span class="text-outline">went wrong.</span></template>
          </h1>
          <p class="m-0 max-w-[32em] text-[17px] leading-7 text-ink-muted">{{ message }}</p>
          <div class="flex flex-wrap gap-2.5">
            <Button variant="marigold" @click="goHome">Back to Dogeash</Button>
            <Button v-if="!notFound" variant="outline" @click="retry">Try again</Button>
          </div>
          <nav v-if="notFound" aria-label="Popular pages" class="flex flex-wrap items-center gap-2 border-t border-line pt-5">
            <span class="mr-1 text-sm font-semibold text-ink-muted">Or try</span>
            <NuxtLink
              v-for="l in links"
              :key="l.to"
              :to="l.to"
              class="rounded-full border-[1.5px] border-line-strong px-3.5 py-1.5 text-sm font-semibold text-ink no-underline hover:border-ink hover:bg-ink hover:text-canvas"
              @click="clearError()"
            >{{ l.label }}</NuxtLink>
          </nav>
        </div>
        <div class="mx-auto w-full max-w-[480px] animate-rise [animation-delay:80ms]">
          <PatrolMap variant="night" />
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>
