<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { definePageMeta, navigateTo, useSeoMeta } from '#imports' // nuxt
import type { TeamMember } from '~/composables/useStoreTeam'
import { useSession } from '~/composables/useSession'
import { useStoreContext } from '~/composables/useStoreContext'
import { useStoreTeam } from '~/composables/useStoreTeam'

// The store's team: who's on it, invitations waiting, and inviting someone new.
// Owners manage it; anyone else on the team can see it and leave.
definePageMeta({ layout: 'dashboard', title: 'Team', middleware: 'store-member' })
useSeoMeta({ title: 'Team · Store dashboard · Dogeash', robots: 'noindex' })

const { user } = useSession()
const { store, can } = useStoreContext()
const team = useStoreTeam()
const { members, invites } = team
onMounted(team.load)

const removing = ref<TeamMember>()
const busy = ref(false)
async function confirmRemove() {
  const leaving = removing.value!.userId === user.value?.id
  busy.value = true
  await team.remove(removing.value!)
  busy.value = false
  removing.value = undefined
  if (leaving) await navigateTo('/account')
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <p class="m-0 max-w-[44em] text-[15px] leading-6 text-ink-muted">
      People who help run {{ store.name }}. Each role opens different parts of this dashboard; a store always keeps at least one owner.
    </p>

    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <DashboardTeamList
        :members="members"
        :invites="invites"
        :manage="can('team')"
        :self="user?.id"
        @role="team.changeRole"
        @remove="m => (removing = m)"
        @withdraw="team.withdraw"
      />
      <DashboardTeamInvite v-if="can('team')" :invite="team.invite" class="self-start" />
    </div>

    <AlertDialog :open="!!removing" @update:open="o => !o && (removing = undefined)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ removing?.userId === user?.id ? `Leave ${store.name}?` : `Remove ${removing?.name || 'this person'}?` }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ removing?.userId === user?.id
              ? 'You lose access to this store\'s dashboard. An owner can invite you back.'
              : 'They lose access to this store\'s dashboard straight away. You can invite them again later.' }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep {{ removing?.userId === user?.id ? 'my place' : 'them' }}</AlertDialogCancel>
          <Button :loading="busy" @click="confirmRemove">{{ removing?.userId === user?.id ? 'Leave the store' : 'Remove' }}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
