<script setup lang="ts">
import { Stethoscope } from '@lucide/vue'
import { ref } from 'vue'
import { navigateTo } from '#imports' // nuxt
import type { ProviderInvite } from '~/composables/useProviderInvites'
import { useProviderInvites } from '~/composables/useProviderInvites'
import { careTypes } from '~/utils/care'

// Dogeash's invitations to manage a care listing, at the top of the account overview. Nothing when there are none.
const { invites, accept, decline } = useProviderInvites()
const busy = ref<string>()
const error = ref('')

async function take(invite: ProviderInvite) {
  busy.value = invite.id
  error.value = (await accept(invite)) ?? ''
  busy.value = undefined
  if (!error.value) await navigateTo('/provider')
}
</script>

<template>
  <section v-if="invites.length" class="flex flex-col gap-3" aria-label="Care listing invitations">
    <article v-for="i in invites" :key="i.id" class="flex flex-wrap items-center gap-4 rounded-xl bg-night p-5 text-on-night">
      <span class="grid size-11 shrink-0 place-items-center rounded-md bg-marigold text-on-marigold"><Stethoscope class="size-5" aria-hidden="true" /></span>
      <div class="flex min-w-[14rem] flex-1 flex-col gap-0.5">
        <strong class="text-[15px] leading-5">Manage {{ i.providerName }} on Dogeash<span class="font-normal opacity-70"> · {{ careTypes[i.providerType].label }}, {{ i.providerCity }}</span></strong>
        <span class="text-[13px] leading-5 opacity-80">Dogeash invited you to answer bookings, keep the listing up to date, and add visits to dogs' records when owners allow it.</span>
      </div>
      <div class="flex gap-2">
        <Button variant="marigold" size="sm" :loading="busy === i.id" :disabled="!!busy" @click="take(i)">Accept</Button>
        <Button variant="outline" size="sm" class="border-on-night/30 bg-transparent text-on-night hover:bg-on-night/10" :disabled="!!busy" @click="decline(i)">Decline</Button>
      </div>
    </article>
    <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
  </section>
</template>
