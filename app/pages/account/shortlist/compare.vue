<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { useSeoMeta } from '#imports' // nuxt

// Compare inside the account area
useSeoMeta({ title: 'Compare dogs · My Dogeash' })
</script>

<template>
  <div class="flex flex-col gap-6">
    <NuxtLink to="/account/shortlist" class="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink">
      <ArrowLeft class="size-4" aria-hidden="true" />Back to shortlist
    </NuxtLink>
    <ShortlistCompare />
  </div>
</template>
