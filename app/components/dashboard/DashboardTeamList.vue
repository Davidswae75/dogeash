<script setup lang="ts">
import { ref } from 'vue'
import type { TeamInvite, TeamMember } from '~/composables/useStoreTeam'
import type { StoreRole } from '~/utils/storeRoles'
import { initialsOf } from '~/utils/account'
import { storeRoles } from '~/utils/storeRoles'
import { shortTime } from '~/utils/time'

// The team: who's on it and their role, then invitations still waiting.
// Owners (`manage`) change roles, remove people and withdraw invitations; everyone else reads it.
const props = defineProps<{ members: TeamMember[], invites: TeamInvite[], manage: boolean, self?: string }>()
const emit = defineEmits<{ role: [member: TeamMember, role: StoreRole], remove: [member: TeamMember], withdraw: [invite: TeamInvite] }>()
// Each pick redraws the select from the saved role: it shows the new role once the team reloads with it,
// and the old one if the change was refused (the last owner, say)
const attempt = ref(0)
function pickRole(m: TeamMember, e: Event) {
  const role = (e.target as HTMLSelectElement).value as StoreRole
  attempt.value++
  if (role !== m.role) emit('role', m, role)
}
const joined = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
</script>

<template>
  <section class="flex flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-line">
    <h2 class="m-0 border-b border-line px-5 py-3.5 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">
      Your team <span class="font-mono text-sm font-normal text-ink-muted">{{ props.members.length }}</span>
    </h2>
    <ul class="m-0 flex list-none flex-col p-0">
      <li v-for="m in props.members" :key="m.userId" class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3 last:border-b-0">
        <span class="grid size-10 shrink-0 place-items-center rounded-full bg-ash-soft text-sm font-bold">{{ initialsOf(m.name || '?') }}</span>
        <span class="flex min-w-[10rem] flex-1 flex-col">
          <strong class="text-sm leading-5">{{ m.name || 'No name yet' }}<span v-if="m.userId === props.self" class="font-normal text-ink-muted"> (you)</span></strong>
          <span class="text-[13px] leading-5 text-ink-muted">{{ m.email ?? storeRoles[m.role].hint }} · since {{ joined(m.joinedAt) }}</span>
        </span>
        <NativeSelect
          v-if="props.manage"
          :key="`${m.userId}:${m.role}:${attempt}`"
          :model-value="m.role"
          :aria-label="`Role for ${m.name || 'this person'}`"
          class="h-9 w-36 border-2 border-line-strong text-sm"
          @change="pickRole(m, $event)"
        >
          <NativeSelectOption v-for="(r, key) in storeRoles" :key="key" :value="key">{{ r.label }}</NativeSelectOption>
        </NativeSelect>
        <span v-else class="rounded-full bg-surface-sunk px-2.5 py-1 text-xs font-bold">{{ storeRoles[m.role].label }}</span>
        <Button v-if="props.manage || m.userId === props.self" variant="ghost" size="sm" @click="emit('remove', m)">
          {{ m.userId === props.self ? 'Leave' : 'Remove' }}
        </Button>
      </li>
    </ul>

    <template v-if="props.manage && props.invites.length">
      <h3 class="m-0 border-y border-line bg-surface-sunk px-5 py-2.5 font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">
        Waiting to join · {{ props.invites.length }}
      </h3>
      <ul class="m-0 flex list-none flex-col p-0">
        <li v-for="i in props.invites" :key="i.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3 last:border-b-0">
          <span class="flex min-w-[10rem] flex-1 flex-col">
            <strong class="text-sm leading-5 break-all">{{ i.email }}</strong>
            <span class="text-[13px] leading-5 text-ink-muted">Invited as {{ storeRoles[i.role].label.toLowerCase() }} · {{ shortTime(i.createdAt) }}</span>
          </span>
          <Button variant="ghost" size="sm" @click="emit('withdraw', i)">Withdraw</Button>
        </li>
      </ul>
    </template>
  </section>
</template>
