<script setup lang="ts">
import { Heart } from '@lucide/vue'
import { useSession } from '~/composables/useSession'
import { useShortlist } from '~/composables/useShortlist'

// The shortlist itself: saved dogs grouped by store, a kennel visit per store, and the compare bar.
// Shown on /shortlist for guests and /account/shortlist inside the account area.
const { byStore, count } = useShortlist()
const { signedIn } = useSession()
</script>

<template>
  <ClientOnly>
    <div v-if="count" class="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div class="flex flex-col gap-5">
        <ShortlistStoreGroup v-for="group in byStore" :key="group.store.id" :store="group.store" :dogs="group.dogs" />
      </div>
      <aside class="flex flex-col gap-4 xl:sticky lg:top-[calc(var(--header-height)+24px)]">
        <HelpPanel title="How buying works">
          Visit the kennel and meet the dog first. When you're sure, reserve one dog with a deposit: it holds the dog while the store prepares handover.
        </HelpPanel>
        <p class="m-0 font-mono text-xs text-ink-muted">{{ signedIn ? 'Saved to your account, on every device.' : 'Saved in this browser until you sign in.' }}</p>
      </aside>
    </div>

    <div v-else class="flex flex-col items-center gap-4 rounded-xl bg-surface px-6 py-14 text-center ring-1 ring-line">
      <span class="grid size-14 place-items-center rounded-full bg-marigold-soft"><Heart class="size-6" aria-hidden="true" /></span>
      <h2 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">Nothing saved yet</h2>
      <p class="m-0 max-w-[30em] text-[15px] leading-6 text-ink-muted">Tap the heart on any dog to keep it here while you decide.{{ signedIn ? '' : ' Your shortlist stays in this browser until you sign in.' }}</p>
      <Button as-child><NuxtLink to="/dogs">Find a guard dog</NuxtLink></Button>
    </div>

    <ShortlistCompareBar />

    <template #fallback>
      <div class="h-64 animate-pulse rounded-xl bg-surface-sunk" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>
