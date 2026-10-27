<script setup lang="ts">
import { ArrowRight, Check } from '@lucide/vue'

// Open a store: the pitch to kennels, how store verification works, what to have ready, and common questions.
// Applying starts at sign-up with the store intent until the full store application exists (PLAN.md Phase 3).
useSeoMeta({
  title: 'Open a store · Dogeash',
  description: 'Open a store on Dogeash and list your kennel\'s trained guard dogs. Every kennel is inspected in person, so serious buyers know your dogs are what you say they are.',
})

const section = homeSection
</script>

<template>
  <div class="flex flex-col gap-16 py-8 sm:py-10">
    <!-- Pitch -->
    <div :class="[section, 'flex flex-col gap-5']">
      <div class="h-2 rounded-full hazard" aria-hidden="true" />
      <section class="grid items-center gap-8 rounded-xl bg-night p-6 text-on-night sm:p-10 lg:grid-cols-[1.2fr_1fr]">
        <div class="flex animate-rise flex-col gap-5">
          <span class="w-fit rounded-[4px] bg-marigold px-2.5 py-1.5 text-xs leading-4 font-bold tracking-[.08em] text-on-marigold uppercase">For kennels and trainers</span>
          <h1 class="m-0 mega text-[clamp(34px,4.2vw,58px)] leading-[.95]">Open your store where buyers <span class="text-outline">check.</span></h1>
          <p class="m-0 max-w-[34em] text-[17px] leading-7 opacity-80">
            Dogeash is a marketplace of inspected kennels. Buyers read the K9 file, compare dogs and book a visit before they call. Open your store, pass one inspection, and let your kennel's record speak for it.
          </p>
          <div class="flex flex-wrap gap-2.5">
            <Button as-child variant="marigold"><NuxtLink to="/sign-up?as=store">Apply to open a store <ArrowRight aria-hidden="true" /></NuxtLink></Button>
            <Button as-child variant="outline" class="border-on-night/30 bg-transparent text-on-night hover:bg-on-night/10"><a href="#verification">How verification works</a></Button>
          </div>
        </div>
        <div class="relative mx-auto w-full max-w-[420px] animate-rise [animation-delay:80ms]">
          <KennelWatch />
        </div>
      </section>
    </div>

    <div :class="section">
      <BigStats :stats="openStoreFacts" />
    </div>

    <!-- Why list here -->
    <section :class="[section, 'flex flex-col gap-6']">
      <h2 class="m-0 mega text-[clamp(24px,2.6vw,34px)] leading-none">Why kennels <span class="text-outline">open a store here</span></h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="r in openStoreReasons" :key="r.title" class="flex animate-rise flex-col gap-3 rounded-lg bg-surface p-5 ring-1 ring-line">
          <span class="grid size-11 place-items-center rounded-md bg-marigold-soft text-marigold-ink"><AppIcon :name="r.icon" :size="24" /></span>
          <strong class="font-display text-[17px] leading-[22px] font-extrabold font-stretch-expanded">{{ r.title }}</strong>
          <p class="m-0 text-sm leading-[22px] text-ink-muted">{{ r.text }}</p>
        </div>
      </div>
    </section>

    <!-- Verification -->
    <section id="verification" :class="[section, 'flex scroll-mt-28 flex-col gap-8']">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h2 class="m-0 mega text-[clamp(24px,2.6vw,34px)] leading-none">Verified in <span class="text-outline">four steps</span></h2>
        <p class="m-0 max-w-[28em] text-sm leading-[22px] text-ink-muted">You can set up your store and add dogs while you wait. Nothing goes public until the inspection passes.</p>
      </div>
      <HowItWorks :steps="storeVerificationSteps" />
    </section>

    <!-- What you need, and questions -->
    <section :class="[section, 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]']">
      <div class="flex flex-col gap-4 self-start rounded-xl bg-marigold-soft p-6 sm:p-7">
        <h2 class="m-0 font-display text-xl leading-6 font-extrabold font-stretch-expanded">Have these ready</h2>
        <ul class="m-0 flex list-none flex-col gap-3 p-0">
          <li v-for="item in openStoreRequirements" :key="item" class="flex gap-3 text-[15px] leading-[22px]">
            <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ink text-canvas"><Check class="size-3" aria-hidden="true" /></span>{{ item }}
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-2">
        <h2 class="m-0 mb-2 font-display text-xl leading-6 font-extrabold font-stretch-expanded">Questions kennels ask</h2>
        <Accordion type="single" collapsible class="rounded-xl bg-surface px-5 ring-1 ring-line">
          <AccordionItem v-for="(item, i) in openStoreQuestions" :key="item.q" :value="`q${i}`" class="border-line">
            <AccordionTrigger class="py-4 text-left text-[15px] font-semibold hover:no-underline">{{ item.q }}</AccordionTrigger>
            <AccordionContent class="pb-4 text-[15px] leading-6 text-ink-muted">{{ item.a }}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>

    <!-- Close -->
    <section :class="section">
      <div class="flex flex-col gap-5 rounded-xl bg-surface p-6 ring-1 ring-line sm:flex-row sm:items-center sm:p-8">
        <div class="flex flex-1 flex-col gap-1.5">
          <strong class="font-display text-xl leading-6 font-extrabold font-stretch-expanded">Already have a store on Dogeash?</strong>
          <p class="m-0 text-[15px] leading-6 text-ink-muted">Sign in with the account you applied with, or look around the store dashboard first.</p>
        </div>
        <div class="flex flex-wrap gap-2.5">
          <Button as-child><NuxtLink to="/sign-in">Sign in to your store</NuxtLink></Button>
          <Button as-child variant="outline"><NuxtLink to="/dashboard">See the store dashboard</NuxtLink></Button>
        </div>
      </div>
    </section>
  </div>
</template>
