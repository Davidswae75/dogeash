<script setup lang="ts">
import { useSeoMeta } from '#imports' // nuxt

// The shortlist inside the account area, so signed-in people stay in their dashboard
useSeoMeta({ title: 'Shortlist · My Dogeash' })
</script>

<template>
  <div class="flex flex-col gap-6 pb-24">
    <AccountHeading kicker="Shortlist · saved to your account" title="Your" outline="shortlist" text="Dogs you're considering, grouped by store. Compare up to three side by side, then book one kennel visit per store to meet them." />
    <ShortlistView />
  </div>
</template>
