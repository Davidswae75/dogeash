<script setup lang="ts">
import { useSeoMeta } from '#imports' // nuxt
import { legalDocs } from '~/utils/legal'

// Terms of use (draft until reviewed by a lawyer; text in app/utils/legal.ts)
useSeoMeta({ title: 'Terms of use · Dogeash' })
</script>

<template>
  <LegalDocument :doc="legalDocs.terms" />
</template>
