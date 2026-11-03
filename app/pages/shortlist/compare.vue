<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt

// Compare for guests. Signed-in people compare inside their account (/account/shortlist/compare).
definePageMeta({ middleware: 'shortlist-home' })
useSeoMeta({ title: 'Compare dogs · Dogeash', robots: 'noindex' })
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col gap-8 px-4 pt-6 pb-16 sm:px-8">
    <NuxtLink to="/shortlist" class="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink">
      <ArrowLeft class="size-4" aria-hidden="true" />Back to shortlist
    </NuxtLink>
    <ShortlistCompare />
  </div>
</template>
