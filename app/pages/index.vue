<script setup lang="ts">
import type { PropertyType } from '~/utils/protection'

definePageMeta({ footer: 'full' })

useSeoMeta({
  title: 'Dogeash · Trained guard dogs from verified kennels',
  description: 'Protection dogs for homes, compounds and estates. Every kennel inspected in person, every dog delivered with a K9 file and handover training.',
})

const query = ref('')

// Example figures until real data exists
const stats = [
  { value: '128', label: 'kennels inspected in person by our team' },
  { value: '100%', label: 'of dogs vet-checked and microchipped before listing' },
  { value: '30', label: 'days of trainer support after handover' },
]

const featured = sampleDogs.slice(0, 3)

function search(q: string) {
  navigateTo({ path: '/dogs', query: q ? { q } : undefined })
}

function pickProperty(property: PropertyType) {
  navigateTo({ path: '/dogs', query: { property } })
}
</script>

<template>
  <div>
    <!-- Stack of rounded blocks, centred in the page column -->
    <div class="mx-auto w-full max-w-[calc(var(--container)+64px)] flex flex-col gap-3 px-3 sm:gap-5 sm:px-8">
      <div class="h-3.5 rounded-full hazard" aria-hidden="true" />

      <section class="grid items-center gap-12 rounded-lg bg-surace px-6 pt-8 pb-12 sm:rounded-xl sm:px-10 sm:pt-10 sm:pb-12 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <div class="flex min-w-0 animate-rise flex-col gap-6">
          <span class="text-xs leading-4 font-bold tracking-[.08em] uppercase">
            <span class="rounded-[4px] bg-marigold px-2.5 py-1.5 text-on-marigold">K9 · Verified kennels · Nigeria</span>
          </span>
          <h1 class="m-0 mega text-[clamp(40px,4.6vw,68px)] text-wrap wrap-break-word leading-[.99] tracking-wide">
            Trained to protect.
            <span class="rounded-lg bg-marigold px-[.1em] text-on-marigold box-decoration-clone">Checked</span>
            <span class="text-outline whitespace-nowrap">by us.</span>
          </h1>
          <p class="m-0 max-w-[28em] text-[17px] leading-[27px] text-ink-muted">
            Guard dogs for homes, compounds and estates. Every kennel inspected in person. Every dog delivered with a K9 file and handover training at your gate.
          </p>
          <SearchBar v-model="query" class="max-w-[560px]" @search="search" />
        </div>
        <div class="relative animate-rise [animation-delay:80ms]">
          <PatrolMap variant="night" />
          <KennelSticker class="absolute -top-8 -right-3 hidden sm:inline-grid" />
        </div>
      </section>

      <PromiseStrip />

      <section aria-label="Dogeash in numbers" class="py-8">
        <BigStats :stats="stats" />
        <p class="mt-3.5 mb-0 font-mono text-[13px] leading-5 font-medium text-ink-muted">Example figures for the design.</p>
      </section>

      <section class="flex flex-col gap-6 rounded-lg bg-ash p-6 text-on-ash sm:rounded-xl sm:p-12">
        <div class="flex items-end justify-between gap-4">
          <h2 class="m-0 mega text-[clamp(30px,3.2vw,42px)] leading-none">What are you<br>protecting?</h2>
          <GuardDog3D class="-my-6 h-[170px]! w-[100px]! shrink-0 sm:h-[220px]! sm:w-[320px]!" />
        </div>
        <PropertyPicker @select="pickProperty" />
      </section>
    </div>

    <section class="mx-auto w-full max-w-[calc(var(--container)+64px)] flex flex-col gap-6 px-4 pt-16 pb-6 sm:px-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h2 class="m-0 mega text-[clamp(30px,3.2vw,42px)] leading-none">Ready <span class="text-outline">now</span></h2>
        <Button as-child variant="outline" size="sm">
          <NuxtLink to="/dogs">All dogs <AppIcon name="arrow-right" :size="16" /></NuxtLink>
        </Button>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 rise-stagger">
        <K9Card v-for="dog in featured" :key="dog.fileNo" :dog="dog" />
      </div>
    </section>

    <section class="mx-auto w-full max-w-[calc(var(--container)+64px)] flex flex-col gap-6 px-4 pt-16 pb-6 sm:px-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h2 class="m-0 mega text-[clamp(30px,3.2vw,42px)] leading-none">Know what<br>a dog will do</h2>
        <p class="m-0 max-w-[22em] text-sm leading-[22px] text-ink-muted">The Dogeash protection scale: five levels, in plain words, checked at every kennel inspection.</p>
      </div>
      <ProtectionLevels />
    </section>

    <section class="mx-auto w-full max-w-[calc(var(--container)+64px)] flex flex-col gap-8 px-4 pt-16 pb-14 sm:px-8">
      <h2 class="m-0 mega text-[clamp(30px,3.2vw,42px)] leading-none">Search to <span class="text-outline">gate</span></h2>
      <HowItWorks />
    </section>
  </div>
</template>
