<script setup lang="ts">
import { Eye } from '@lucide/vue'
import type { Store } from '~/utils/stores'

// Top of a store's own pages, for people who work there: this is what buyers see
const props = defineProps<{ store: Store, what: 'store' | 'listing' }>()
const { memberOf } = useSession()
const role = computed(() => memberOf(props.store.id)?.role)
</script>

<template>
  <div v-if="role" class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-night px-4 py-2.5 text-sm text-on-night">
    <Eye class="size-4 shrink-0 text-marigold" aria-hidden="true" />
    <span class="flex-1">
      <strong>{{ props.what === 'store' ? 'This is your store.' : 'This is your listing.' }}</strong>
      You're seeing it as buyers do. You're {{ storeRoles[role].label.toLowerCase() === 'owner' ? 'the owner' : `a ${storeRoles[role].label.toLowerCase()}` }} at {{ props.store.name }}.
    </span>
    <NuxtLink to="/dashboard" class="font-bold text-marigold underline underline-offset-4">Open dashboard</NuxtLink>
  </div>
</template>
