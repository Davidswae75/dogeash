<script setup lang="ts">
// The buyer's account area: sidebar (tabs on phones) around each section's page. Needs an account.
definePageMeta({ middleware: 'signed-in' })
useSeoMeta({ robots: 'noindex' })
</script>

<template>
  <div :class="[homeSection, 'flex flex-col gap-6 py-6 sm:py-8 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-10']">
    <AccountNav />
    <div class="min-w-0">
      <NuxtPage />
    </div>
  </div>
</template>
