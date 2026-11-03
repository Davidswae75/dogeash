<script setup lang="ts">
import { useSeoMeta } from '#imports' // nuxt
import { legalDocs } from '~/utils/legal'

// Privacy policy (draft until reviewed by a lawyer; text in app/utils/legal.ts)
useSeoMeta({ title: 'Privacy policy · Dogeash' })
</script>

<template>
  <LegalDocument :doc="legalDocs.privacy" />
</template>
