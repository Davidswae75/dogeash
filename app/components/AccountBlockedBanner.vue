<script setup lang="ts">
import { Ban } from '@lucide/vue'
import { useAccountBlock } from '~/composables/useAccountBlock'

// Shown across the site to a blocked account: that it's blocked, why, and that it can only read for now
const { block } = useAccountBlock()
</script>

<template>
  <div v-if="block" class="border-b border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-ink sm:px-8" role="alert">
    <span class="mx-auto flex max-w-page items-start gap-2.5">
      <Ban class="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
      <span><strong class="font-semibold">Your account is blocked.</strong> {{ block.reason }} You can still browse, but you can't message, book, review, list or save anything. Contact Dogeash if you think this is a mistake.</span>
    </span>
  </div>
</template>
