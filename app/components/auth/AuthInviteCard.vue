<script setup lang="ts">
import type { InviteCopy } from '~/composables/useInviteLink'

// What an invitation link is for, in place of "What brings you here?" on sign-up and above sign-in
const props = defineProps<{ card: InviteCopy['card'], notYou?: string }>()
</script>

<template>
  <div class="flex items-start gap-3.5 rounded-xl bg-night p-4 text-on-night">
    <span class="grid size-11 shrink-0 place-items-center rounded-lg bg-marigold text-on-marigold"><component :is="props.card.icon" class="size-5" aria-hidden="true" /></span>
    <div class="flex min-w-0 flex-col gap-1">
      <strong class="text-[15px] leading-5">{{ props.card.label }}</strong>
      <span class="text-[13px] leading-5 opacity-80">{{ props.card.text }}</span>
      <NuxtLink v-if="props.notYou" :to="props.notYou" class="mt-1 w-fit text-[13px] font-semibold text-marigold">Not you? Use the ordinary sign-up</NuxtLink>
    </div>
  </div>
</template>
