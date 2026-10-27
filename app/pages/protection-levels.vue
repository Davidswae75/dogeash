<script setup lang="ts">
import type { ProtectionLevel } from '~/utils/protection'

// The Dogeash protection scale in full: the five levels at a glance, then each one in detail with dogs
useSeoMeta({
  title: 'Protection levels · Dogeash',
  description: 'The five Dogeash protection levels in plain words: what each guard dog does, what it won\'t do, who it suits and what it costs.',
})

const levels = Object.keys(protectionLevels).map(Number) as ProtectionLevel[]
</script>

<template>
  <div :class="[homeSection, 'flex flex-col gap-12 py-8 sm:py-10']">
    <header class="flex flex-col gap-6">
      <div class="h-2 rounded-full hazard" aria-hidden="true" />
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div class="flex max-w-[44em] flex-col gap-3">
          <span class="font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">The Dogeash scale · checked at every inspection</span>
          <h1 class="m-0 mega text-[clamp(34px,4.4vw,60px)] leading-[.95]">Five levels. <span class="text-outline">Plain words.</span></h1>
          <p class="m-0 text-[17px] leading-7 text-ink-muted">
            Every dog on Dogeash carries one level, confirmed by our inspector at the kennel. It tells you what the dog will do, and just as importantly, what it won't.
          </p>
        </div>
        <nav aria-label="Jump to a level" class="flex flex-wrap gap-1.5">
          <a
            v-for="n in levels"
            :key="n"
            :href="`#level-${n}`"
            class="grid size-10 place-items-center rounded-full border-[1.5px] border-line-strong font-display font-extrabold text-ink no-underline hover:border-ink hover:bg-ink hover:text-canvas"
          >{{ n }}</a>
        </nav>
      </div>
      <ProtectionLevels />
    </header>

    <ProtectionLevelDetail v-for="n in levels" :key="n" :level="n" />

    <aside class="flex flex-col gap-5 rounded-xl bg-night p-6 text-on-night sm:flex-row sm:items-center sm:p-8">
      <div class="flex flex-1 flex-col gap-1.5">
        <strong class="font-display text-xl leading-6 font-extrabold font-stretch-expanded">Not sure which level fits?</strong>
        <p class="m-0 max-w-[40em] text-[15px] leading-6 opacity-80">Start with what you're protecting. Most family homes need level 2 to 4; compounds with a gateman suit level 3.</p>
      </div>
      <div class="flex flex-wrap gap-2.5">
        <Button as-child variant="marigold"><NuxtLink to="/guide">Read the buyer's guide</NuxtLink></Button>
        <Button as-child variant="outline" class="border-on-night/30 bg-transparent text-on-night hover:bg-on-night/10"><NuxtLink to="/dogs">Browse all dogs</NuxtLink></Button>
      </div>
    </aside>
  </div>
</template>
