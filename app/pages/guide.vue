<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'
import type { GuideRating } from '~/utils/guide'

useSeoMeta({
  title: "Should you get a guard dog? Buyer's guide · Dogeash",
  description: 'An honest look at the benefits, costs and risks of keeping a guard dog at your home or compound in Nigeria, with a 10-point readiness check.',
})

const ratingIcon: Record<GuideRating, IconName> = { yes: 'check', partly: 'minus', no: 'x' }
const ratingLabel: Record<GuideRating, string> = { yes: 'Yes', partly: 'Partly', no: 'No' }
const ratingTone: Record<GuideRating, string> = {
  yes: 'bg-marigold text-on-marigold',
  partly: 'bg-ash-soft text-ink',
  no: 'bg-transparent text-ink-muted border border-line-strong',
}

// Highlight the section in view in the contents list
const { active, goTo } = useSectionSpy(guideSections.map(s => s.id))

const eyebrow = 'text-xs leading-4 font-bold tracking-[.08em] uppercase'
const h2 = 'm-0 mega text-[clamp(28px,3vw,40px)] leading-none scroll-mt-28'
const lead = 'm-0 max-w-[40em] text-[17px] leading-[28px] text-ink-muted'
</script>

<template>
  <div class="mx-auto w-full max-w-[calc(var(--container)+64px)] px-4 pb-16 sm:px-8">
    <!-- Hero -->
    <header class="grid items-center gap-8 pt-8 pb-12 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pt-12">
      <div class="flex animate-rise flex-col gap-5">
        <span :class="eyebrow"><span class="rounded-[4px] bg-marigold px-2.5 py-1.5 text-on-marigold">Buyer's guide</span></span>
        <h1 class="m-0 mega text-[clamp(40px,4.6vw,64px)] leading-[.95]">
          Should you get a <span class="text-outline whitespace-nowrap">guard dog?</span>
        </h1>
        <p class="m-0 max-w-[32em] text-[17px] leading-[28px] text-ink-muted">
          An honest look at what a guard dog does for your home, what it costs you, and the risks people don't mention. Read it before you buy, from us or anyone else.
        </p>
        <p class="m-0 font-mono text-[13px] text-ink-muted">14 min read · Updated October 2026</p>
      </div>
      <GuideImageSlot :image="guideImages.hero" class="animate-rise [animation-delay:80ms]" />
    </header>

    <div class="h-3.5 rounded-full hazard" aria-hidden="true" />

    <div class="grid gap-10 pt-12 lg:grid-cols-[220px_1fr] lg:gap-14">
      <!-- Contents -->
      <nav aria-label="On this page" class="hidden lg:block">
        <div class="sticky top-24 flex flex-col gap-3">
          <span :class="[eyebrow, 'text-ink-muted']">On this page</span>
          <ol class="m-0 flex list-none flex-col gap-0.5 border-l-2 border-line p-0">
            <li v-for="s in guideSections" :key="s.id">
              <a
                :href="`#${s.id}`"
                @click.exact.prevent="goTo(s.id)"
                :aria-current="active === s.id ? 'true' : undefined"
                :class="[
                  '-ml-0.5 block border-l-2 py-1.5 pl-3.5 text-sm leading-5 no-underline',
                  active === s.id ? 'border-marigold font-bold text-ink' : 'border-transparent text-ink-muted hover:text-ink',
                ]"
              >{{ s.label }}</a>
            </li>
          </ol>
        </div>
      </nav>

      <article class="flex min-w-0 flex-col gap-20">
        <!-- Short answer -->
        <section id="short-answer" class="flex flex-col gap-6 scroll-mt-28">
          <h2 :class="h2">The short answer</h2>
          <p :class="lead">
            A guard dog is one of the most effective deterrents a home in Nigeria can have, and one of the most demanding. It works when the power is out, it covers the whole compound, and it warns you first. In return it needs daily time, steady money and a household that will follow the rules.
          </p>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="flex flex-col gap-4 rounded-lg bg-surface p-6 ring-1 ring-line">
              <span :class="eyebrow">A guard dog suits you if</span>
              <ul class="m-0 flex list-none flex-col gap-3 p-0">
                <li v-for="item in guideSuitsYouIf" :key="item" class="flex gap-3 text-[15px] leading-[22px]">
                  <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-marigold text-on-marigold"><AppIcon name="check" :size="14" :stroke-width="3" /></span>
                  {{ item }}
                </li>
              </ul>
            </div>
            <div class="flex flex-col gap-4 rounded-lg bg-night p-6 text-on-night">
              <span :class="eyebrow">Think twice if</span>
              <ul class="m-0 flex list-none flex-col gap-3 p-0">
                <li v-for="item in guideThinkTwiceIf" :key="item" class="flex gap-3 text-[15px] leading-[22px]">
                  <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-marigold text-marigold"><AppIcon name="x" :size="12" :stroke-width="3" /></span>
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Benefits -->
        <section id="benefits" class="flex flex-col gap-8 scroll-mt-28">
          <div class="flex flex-col gap-3">
            <span :class="[eyebrow, 'text-marigold-ink']">The case for</span>
            <h2 :class="h2">What a guard dog <span class="text-outline">does well</span></h2>
          </div>
          <div class="grid gap-x-10 gap-y-8 md:grid-cols-2">
            <div v-for="point in guideBenefits" :key="point.title" class="flex gap-4">
              <span class="grid size-11 shrink-0 place-items-center rounded-md bg-marigold text-on-marigold">
                <AppIcon :name="point.icon" :size="24" />
              </span>
              <div class="flex flex-col gap-1.5">
                <h3 class="m-0 font-display text-[19px] leading-6 font-extrabold font-stretch-expanded">{{ point.title }}</h3>
                <p class="m-0 text-[15px] leading-6 text-ink-muted">{{ point.body }}</p>
              </div>
            </div>
          </div>
          <div class="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <GuideImageSlot :image="guideImages.family" />
            <GuideImageSlot :image="guideImages.night" />
          </div>
        </section>

        <!-- Drawbacks -->
        <section id="drawbacks" class="-mx-4 flex flex-col gap-8 rounded-lg bg-ash px-4 py-10 text-on-ash scroll-mt-28 sm:mx-0 sm:rounded-xl sm:p-10">
          <div class="flex flex-col gap-3">
            <span :class="eyebrow">The case against</span>
            <h2 :class="h2">What it <span class="text-outline [-webkit-text-stroke-color:var(--on-ash)]">costs you</span></h2>
            <p class="m-0 max-w-[40em] text-[17px] leading-[28px]">Every one of these can be managed. None of them goes away on its own.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div v-for="point in guideDrawbacks" :key="point.title" class="flex flex-col gap-3 rounded-lg bg-surface p-5 text-ink">
              <div class="flex items-center gap-3">
                <span class="grid size-10 shrink-0 place-items-center rounded-md bg-night text-marigold">
                  <AppIcon :name="point.icon" :size="24" />
                </span>
                <h3 class="m-0 font-display text-[17px] leading-[22px] font-extrabold font-stretch-expanded">{{ point.title }}</h3>
              </div>
              <p class="m-0 text-[15px] leading-6 text-ink-muted">{{ point.body }}</p>
              <p v-if="point.note" class="m-0 mt-auto flex gap-2 border-t border-line pt-3 text-sm leading-[21px]">
                <strong class="shrink-0">Reduce it:</strong>
                <span>{{ point.note }}</span>
              </p>
            </div>
          </div>
        </section>

        <!-- Poisoning -->
        <section id="poisoning" class="grid gap-8 scroll-mt-28 md:grid-cols-[1fr_1.2fr] md:items-start">
          <GuideImageSlot :image="guideImages.feeding" class="md:sticky md:top-24" />
          <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-3">
              <span :class="[eyebrow, 'inline-flex items-center gap-2 text-danger']"><AppIcon name="warning" :size="16" />Read this before you buy</span>
              <h2 :class="h2">The poisoning risk</h2>
              <p :class="lead">The most common way intruders get past a guard dog in Nigeria is not a fight. It is food thrown over the wall the night before. These four habits close that gap.</p>
            </div>
            <ol class="m-0 flex list-none flex-col gap-5 p-0">
              <li v-for="(step, i) in guidePoisoningSteps" :key="step.title" class="flex gap-4">
                <span class="grid size-10 shrink-0 place-items-center rounded-full bg-night font-display text-lg font-black text-marigold font-stretch-expanded">{{ i + 1 }}</span>
                <div class="flex flex-col gap-1">
                  <h3 class="m-0 text-base leading-6 font-bold">{{ step.title }}</h3>
                  <p class="m-0 text-[15px] leading-6 text-ink-muted">{{ step.body }}</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <!-- Compare -->
        <section id="compare" class="flex flex-col gap-8 scroll-mt-28">
          <div class="flex flex-col gap-3">
            <h2 :class="h2">Dog, guard, cameras <span class="text-outline">or fence?</span></h2>
            <p :class="lead">No single option does everything. The question is which gaps a dog fills for your home.</p>
          </div>
          <div class="overflow-x-auto rounded-lg ring-1 ring-line">
            <table class="w-full min-w-[640px] border-collapse bg-surface text-left text-sm">
              <caption class="sr-only">How a guard dog compares with a security guard, CCTV and alarm, and an electric fence</caption>
              <thead>
                <tr class="bg-night text-on-night">
                  <th scope="col" class="px-4 py-3 font-mono text-[11px] font-semibold tracking-[.1em] uppercase">What you need</th>
                  <th v-for="(opt, i) in guideComparisonOptions" :key="opt" scope="col" :class="['px-3 py-3 text-center text-[13px] font-bold', i === 0 && 'text-marigold']">{{ opt }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in guideComparison" :key="row.label" class="border-t border-line">
                  <th scope="row" class="px-4 py-3 font-semibold">
                    {{ row.label }}
                    <span v-if="row.note" class="mt-0.5 block text-xs font-normal text-ink-muted">{{ row.note }}</span>
                  </th>
                  <td v-for="(value, i) in row.values" :key="i" :class="['px-3 py-3 text-center', i === 0 && 'bg-marigold-soft']">
                    <span :class="['inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', ratingTone[value]]">
                      <AppIcon :name="ratingIcon[value]" :size="14" :stroke-width="3" />
                      {{ ratingLabel[value] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex flex-col gap-5 rounded-lg bg-surface p-6 ring-1 ring-line sm:p-8">
            <div class="flex flex-col gap-2">
              <span :class="[eyebrow, 'text-ink-muted']">The layered approach</span>
              <h3 class="m-0 font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">The strongest homes use layers</h3>
              <p class="m-0 max-w-[40em] text-[15px] leading-6 text-ink-muted">The wall keeps people out, the dog covers the yard, locks slow down entry to the house. Each layer covers what the one outside it misses.</p>
            </div>
            <GuideSecurityLayers />
          </div>
        </section>

        <!-- Costs -->
        <section id="costs" class="flex flex-col gap-8 scroll-mt-28">
          <div class="flex flex-col gap-3">
            <h2 :class="h2">First-year <span class="text-outline">costs</span></h2>
            <p :class="lead">The purchase is the biggest single cost, but food and care add up to as much again over the first year. After that, expect the running costs every year for the dog's life.</p>
          </div>
          <GuideCostBars />
          <div class="grid gap-4 md:grid-cols-2">
            <GuideImageSlot :image="guideImages.vet" />
            <HelpPanel title="Ask the store before you pay">
              What the dog eats and how much, when its next vaccines are due, which vet it sees now, and whether the price includes handover training. Every Dogeash K9 file lists vaccinations and the last inspection date.
            </HelpPanel>
          </div>
        </section>

        <!-- Level -->
        <section id="level" class="flex flex-col gap-8 scroll-mt-28">
          <div class="flex flex-col gap-3">
            <h2 :class="h2">Which level fits <span class="text-outline">your home</span></h2>
            <p :class="lead">Choose the lowest protection level that covers your need. A higher level is not a better dog; it is a dog that needs more control.</p>
          </div>
          <ul class="m-0 flex list-none flex-col gap-3 p-0">
            <li v-for="row in guideLevels" :key="row.level" class="grid items-center gap-4 rounded-lg bg-surface p-4 ring-1 ring-line sm:grid-cols-[64px_1fr_1fr_1.3fr] sm:gap-6 sm:p-5">
              <span class="mega text-[44px] leading-none">{{ row.level }}</span>
              <span>
                <span :class="[eyebrow, 'block text-ink-muted']">Home</span>
                <span class="text-[15px] font-semibold">{{ row.home }}</span>
              </span>
              <span>
                <span :class="[eyebrow, 'block text-ink-muted']">Household</span>
                <span class="text-[15px] font-semibold">{{ row.household }}</span>
              </span>
              <span class="flex flex-col gap-2">
                <ProtectionScale :level="row.level" />
                <span class="text-sm leading-5 text-ink-muted">{{ row.note }}</span>
              </span>
            </li>
          </ul>
          <div>
            <Button as-child variant="outline">
              <NuxtLink to="/protection-levels">All five levels explained <AppIcon name="arrow-right" :size="16" /></NuxtLink>
            </Button>
          </div>
        </section>

        <!-- Ready -->
        <section id="ready" class="flex flex-col gap-8 scroll-mt-28">
          <div class="flex flex-col gap-3">
            <span :class="[eyebrow, 'text-marigold-ink']">10-point check</span>
            <h2 :class="h2">Are you <span class="text-outline">ready?</span></h2>
            <p :class="lead">Tick what is true for your home today. Be honest; nobody sees your answers.</p>
          </div>
          <GuideReadinessCheck />
          <GuideImageSlot :image="guideImages.handover" />
        </section>

        <!-- FAQ -->
        <section id="faq" class="flex flex-col gap-6 scroll-mt-28">
          <h2 :class="h2">Questions <span class="text-outline">buyers ask</span></h2>
          <Accordion type="single" collapsible class="border-t-4 border-ink">
            <AccordionItem v-for="(item, i) in guideFaqs" :key="item.q" :value="`faq-${i}`" class="border-b border-line">
              <AccordionTrigger class="py-5 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded hover:no-underline">{{ item.q }}</AccordionTrigger>
              <AccordionContent class="max-w-[42em] pb-5 text-[15px] leading-6 text-ink-muted">{{ item.a }}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <!-- Next step -->
        <section class="flex flex-col gap-6 rounded-lg bg-night p-8 text-on-night sm:rounded-xl sm:p-12">
          <span :class="[eyebrow, 'text-marigold']">Next step</span>
          <h2 class="m-0 mega text-[clamp(28px,3vw,40px)] leading-none">Find a dog that fits <span class="text-outline [-webkit-text-stroke-color:var(--on-night)]">your home</span></h2>
          <p class="m-0 max-w-[36em] text-[17px] leading-[28px]">Every dog on Dogeash comes from a kennel we inspect in person, with a K9 file, a protection level and handover training at your gate.</p>
          <div class="flex flex-wrap gap-3">
            <Button as-child variant="marigold">
              <NuxtLink to="/dogs">Find a guard dog</NuxtLink>
            </Button>
            <Button as-child variant="night">
              <NuxtLink to="/protection-levels">Compare protection levels</NuxtLink>
            </Button>
          </div>
        </section>
      </article>
    </div>
  </div>
</template>
