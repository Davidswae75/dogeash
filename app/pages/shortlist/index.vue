<script setup lang="ts">
import { definePageMeta, useSeoMeta } from '#imports' // nuxt

// The buyer's shortlist for guests. Signed-in people have it in their account (/account/shortlist).
// Dogs aren't bought from here: buyers visit, then reserve one dog with a deposit.
definePageMeta({ middleware: 'shortlist-home' })
useSeoMeta({ title: 'Your shortlist · Dogeash', robots: 'noindex' })
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col gap-8 px-4 pt-8 pb-32 sm:px-8 sm:pt-12">
    <header class="flex flex-col gap-3">
      <h1 class="m-0 mega text-[clamp(32px,4vw,52px)] leading-[.98]">Your <span class="text-outline">shortlist</span></h1>
      <p class="m-0 max-w-[40em] text-[16px] leading-[26px] text-ink-muted">
        Dogs you're considering, grouped by store. Compare up to three side by side, then book one kennel visit per store to meet them.
      </p>
    </header>
    <ShortlistView />
  </div>
</template>
