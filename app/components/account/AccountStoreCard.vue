<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import type { Store } from '~/utils/stores'
import type { StoreRole } from '~/utils/storeRoles'

// "Your store" in the account menus: which store, your role, what's waiting, and the way into the dashboard
const props = defineProps<{ store: Store, role: StoreRole }>()
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg bg-night p-3.5 text-on-night">
    <div class="flex items-center gap-3">
      <StoreAvatar :initials="props.store.initials" class="size-10 rounded-lg ring-1 ring-on-night/25" />
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="font-mono text-[10px] font-semibold tracking-[.12em] text-marigold uppercase">Your store · {{ storeRoles[props.role].label }}</span>
        <strong class="truncate text-sm leading-5">{{ props.store.name }}</strong>
        <span class="flex items-center gap-1.5 text-xs opacity-80">
          <span :class="['size-1.5 rounded-full', props.store.verified ? 'bg-marigold' : 'bg-ash']" aria-hidden="true" />
          {{ props.store.verified ? 'Verified' : 'In review' }} · {{ storeActivityLine(props.store.id) }}
        </span>
      </div>
    </div>
    <NuxtLink to="/dashboard" class="flex items-center justify-between rounded-md bg-marigold px-3 py-2 text-sm font-bold text-on-marigold no-underline hover:brightness-95">
      Go to store dashboard <ArrowRight class="size-4" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>
