<script setup lang="ts">
import { Users } from '@lucide/vue'
import { ref } from 'vue'
import type { StoreInvite } from '~/composables/useStoreInvites'
import { useStoreInvites } from '~/composables/useStoreInvites'
import { storeRoles } from '~/utils/storeRoles'

// Invitations to join a store's team, at the top of the account overview. Shows nothing when there are none.
const { invites, accept, decline } = useStoreInvites()
const busy = ref<string>()
const error = ref('')

async function join(invite: StoreInvite) {
  busy.value = invite.id
  error.value = (await accept(invite)) ?? ''
  busy.value = undefined
}
</script>

<template>
  <section v-if="invites.length" class="flex flex-col gap-3" aria-label="Store invitations">
    <article v-for="i in invites" :key="i.id" class="flex flex-wrap items-center gap-4 rounded-xl bg-night p-5 text-on-night">
      <span class="grid size-11 shrink-0 place-items-center rounded-md bg-marigold text-on-marigold"><Users class="size-5" aria-hidden="true" /></span>
      <div class="flex min-w-[14rem] flex-1 flex-col gap-0.5">
        <strong class="text-[15px] leading-5">Join {{ i.storeName }}<span v-if="i.storeCity" class="font-normal opacity-70"> · {{ i.storeCity }}</span></strong>
        <span class="text-[13px] leading-5 opacity-80">
          {{ i.invitedBy || 'The owner' }} invited you as {{ storeRoles[i.role].label.toLowerCase() }}: {{ storeRoles[i.role].hint.toLowerCase() }}.
        </span>
      </div>
      <div class="flex gap-2">
        <Button variant="marigold" size="sm" :loading="busy === i.id" :disabled="!!busy" @click="join(i)">Join the team</Button>
        <Button variant="outline" size="sm" class="border-on-night/30 bg-transparent text-on-night hover:bg-on-night/10" :disabled="!!busy" @click="decline(i)">Decline</Button>
      </div>
    </article>
    <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
  </section>
</template>
