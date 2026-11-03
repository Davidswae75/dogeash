<script setup lang="ts">
import { ArrowRight, House } from '@lucide/vue'

// Shown where matched dogs would be, until the person fills in their home profile
</script>

<template>
  <NuxtLink to="/account/profile" class="group flex items-center gap-4 rounded-xl bg-marigold-soft p-5 text-ink no-underline ring-1 ring-marigold/40 hover:ring-ink">
    <span class="grid size-11 shrink-0 place-items-center rounded-lg bg-marigold text-on-marigold"><House class="size-5" aria-hidden="true" /></span>
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <strong class="font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">Tell us about your home</strong>
      <span class="text-sm leading-5 text-ink-muted">What you're protecting, who lives there and your experience. Takes a minute, and we'll match dogs to it.</span>
    </span>
    <ArrowRight class="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
  </NuxtLink>
</template>
