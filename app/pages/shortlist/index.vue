<script setup lang="ts">
import { Heart } from '@lucide/vue'

// The buyer's shortlist: saved dogs grouped by store, a kennel visit per store, and compare.
// Dogs aren't bought from here: buyers visit, then reserve one dog with a deposit.
useSeoMeta({ title: 'Your shortlist · Dogeash', robots: 'noindex' })

const { byStore, count } = useShortlist()
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col gap-8 px-4 pt-8 pb-32 sm:px-8 sm:pt-12">
    <header class="flex flex-col gap-3">
      <h1 class="m-0 mega text-[clamp(32px,4vw,52px)] leading-[.98]">Your <span class="text-outline">shortlist</span></h1>
      <p class="m-0 max-w-[40em] text-[16px] leading-[26px] text-ink-muted">
        Dogs you're considering, grouped by store. Compare up to three side by side, then book one kennel visit per store to meet them.
      </p>
    </header>

    <ClientOnly>
      <div v-if="count" class="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
        <div class="flex flex-col gap-5">
          <ShortlistStoreGroup v-for="group in byStore" :key="group.store.id" :store="group.store" :dogs="group.dogs" />
        </div>
        <aside class="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+24px)]">
          <HelpPanel title="How buying works">
            Visit the kennel and meet the dog first. When you're sure, reserve one dog with a deposit: it holds the dog while the store prepares handover.
          </HelpPanel>
          <p class="m-0 font-mono text-xs text-ink-muted">Saved in this browser until you sign in.</p>
        </aside>
      </div>

      <div v-else class="flex flex-col items-center gap-4 rounded-xl bg-surface px-6 py-14 text-center ring-1 ring-line">
        <span class="grid size-14 place-items-center rounded-full bg-marigold-soft"><Heart class="size-6" aria-hidden="true" /></span>
        <h2 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">Nothing saved yet</h2>
        <p class="m-0 max-w-[30em] text-[15px] leading-6 text-ink-muted">Tap the heart on any dog to keep it here while you decide. Your shortlist stays in this browser.</p>
        <Button as-child><NuxtLink to="/dogs">Find a guard dog</NuxtLink></Button>
      </div>

      <ShortlistCompareBar />

      <template #fallback>
        <div class="h-64 animate-pulse rounded-xl bg-surface-sunk" aria-hidden="true" />
      </template>
    </ClientOnly>
  </div>
</template>
