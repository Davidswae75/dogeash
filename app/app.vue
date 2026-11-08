<script setup lang="ts">
import { useRuntimeConfig, useSeoMeta } from '#imports' // nuxt

// Share previews (WhatsApp, X, Facebook, iMessage) for every page: the dog mark share image, unless a page
// sets its own. Crawlers need the image as a full address, so it uses SITE_URL once that's set.
const siteUrl = String(useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')
useSeoMeta({
  ogSiteName: 'Dogeash',
  ogType: 'website',
  ogImage: `${siteUrl}/og-image.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Dogeash: trained guard dogs from kennels we inspect in person',
  twitterCard: 'summary_large_image',
  twitterImage: `${siteUrl}/og-image.png`,
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <!-- Page changes: a thin marigold bar along the top -->
  <NuxtLoadingIndicator color="var(--marigold)" :height="3" :throttle="150" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Waits with no other visible progress, such as signing out: useLoader().run() -->
  <AppLoader />
</template>
