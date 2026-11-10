<script setup lang="ts">
import { definePageMeta } from '#imports' // nuxt

// The provider dashboard, for someone who manages a care listing (a vet, a trainer…): its own layout with a
// sidebar (layouts/provider.vue), then bookings (/provider) and the listing (/provider/listing).
// Needs a listing to manage (Dogeash invites providers).
definePageMeta({ layout: 'provider', middleware: 'provider-member' })
</script>

<template>
  <NuxtPage />
</template>
