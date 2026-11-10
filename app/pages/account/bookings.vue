<script setup lang="ts">
import { definePageMeta } from '#imports' // nuxt
// The old "Visits and bookings" address (in older notifications and links): kennel visits are at
// /account/visits now, care appointments at /account/care
definePageMeta({ redirect: '/account/visits' })
</script>

<template>
  <div />
</template>
