<script setup lang="ts">
import { BellRing } from '@lucide/vue'
import { useSeoMeta } from '#imports' // nuxt
import { useSavedSearches } from '~/composables/useSavedSearches'

// Saved searches: the searches you keep, the dogs matching each now, and whether to be told about new ones.
// Saved from Find a guard dog ("Save this search"). Alerts are sent once notifications are connected.
useSeoMeta({ title: 'Saved searches · My Dogeash' })
const { searches } = useSavedSearches()
</script>

<template>
  <div class="flex flex-col gap-6">
    <AccountHeading kicker="Saved searches · up to 20" title="Your" outline="searches" text="Searches you've saved on Find a guard dog. With alerts on, we tell you when a new dog matches, so you don't have to keep checking." />

    <ul v-if="searches.length" class="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-4 p-0 xl:grid-cols-2">
      <AccountSavedSearch v-for="s in searches" :key="s.id" :search="s" />
    </ul>

    <div v-else class="flex flex-col items-center gap-4 rounded-xl bg-surface px-6 py-14 text-center ring-1 ring-line">
      <span class="grid size-14 place-items-center rounded-full bg-marigold-soft"><BellRing class="size-6" aria-hidden="true" /></span>
      <h2 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">No saved searches yet</h2>
      <p class="m-0 max-w-[32em] text-[15px] leading-6 text-ink-muted">On Find a guard dog, choose the level, city and kind of property you want, then tap "Save this search". We'll keep it here and tell you when a new dog matches.</p>
      <Button as-child><NuxtLink to="/dogs">Find a guard dog</NuxtLink></Button>
    </div>
  </div>
</template>
