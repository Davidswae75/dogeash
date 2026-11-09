<script setup lang="ts">
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useSession } from '~/composables/useSession'

// Home is the marketplace. Visitors get a compact intro first; signed-in buyers get their own
// marketplace (activity, bookings, matched dogs) with the introductions left out.
definePageMeta({ footer: 'full' })

useSeoMeta({
  title: 'Dogeash · Trained guard dogs from verified kennels',
  description: 'Buy trained guard dogs for homes, compounds and estates in Nigeria. Every kennel inspected in person, every dog with its records and handover training.',
})

const { signedIn } = useSession()
</script>

<template>
  <HomeSignedIn v-if="signedIn" />
  <HomeGuest v-else />
</template>
