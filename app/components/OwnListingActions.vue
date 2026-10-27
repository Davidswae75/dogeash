<script setup lang="ts">
import { CalendarDays, LayoutDashboard, MessageSquare, PencilLine, Store as StoreIcon } from '@lucide/vue'
import type { Dog } from '~/utils/dogs'
import type { Store } from '~/utils/stores'

// In place of Contact and Book on a store's own pages: what its people can do here, by role.
// Nobody can save, message, book or buy from their own store.
const props = withDefaults(defineProps<{ store: Store, dog?: Dog, tone?: 'night' | 'surface' }>(), { tone: 'surface' })
const { can } = useSession()

const enquiries = computed(() => props.dog ? dashboardDogStats[props.dog.fileNo]?.enquiries ?? 0 : storeActivity[props.store.id]?.enquiries ?? 0)

const actions = computed(() => [
  props.dog
    ? { to: '/dashboard/dogs', label: `Edit ${props.dog.name}`, icon: PencilLine, show: can(props.store.id, 'dogs') }
    : { to: '/dashboard/profile', label: 'Edit store profile', icon: StoreIcon, show: can(props.store.id, 'profile') },
  { to: '/dashboard/inbox?type=message', label: `Enquiries${enquiries.value ? ` (${enquiries.value})` : ''}`, icon: MessageSquare, show: can(props.store.id, 'enquiries') },
  { to: '/dashboard/bookings', label: 'Kennel visits', icon: CalendarDays, show: can(props.store.id, 'bookings') },
  { to: '/dashboard', label: 'Store dashboard', icon: LayoutDashboard, show: true },
].filter(a => a.show))
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <span :class="['font-mono text-[10.5px] font-semibold tracking-[.12em] uppercase', props.tone === 'night' ? 'text-marigold' : 'text-ink-muted']">
      {{ props.dog ? 'Your listing' : 'Your store' }}
    </span>
    <Button
      v-for="(a, i) in actions"
      :key="a.to"
      as-child
      :variant="i === 0 ? 'marigold' : props.tone === 'night' ? 'night' : 'outline'"
      class="w-full justify-start"
    >
      <NuxtLink :to="a.to"><component :is="a.icon" aria-hidden="true" />{{ a.label }}</NuxtLink>
    </Button>
  </div>
</template>
