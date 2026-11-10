<script setup lang="ts">
import { CalendarCheck, ExternalLink, LogOut, Store, X } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from '#imports' // nuxt
import { useAccountMode } from '~/composables/useAccountMode'
import { useProviderDashboard } from '~/composables/useProviderDashboard'
import { useSession } from '~/composables/useSession'
import { careTypes } from '~/utils/care'

// Sidebar of the provider dashboard (and its phone sheet): the listing, the two sections, the public page,
// and at the foot who's signed in, the switch to the buyer account, and the theme
const props = defineProps<{ inSheet?: boolean }>()
const { user, initials, signOut } = useSession()
const { membership, requests, listing } = useProviderDashboard()
const { switchTo } = useAccountMode()
const route = useRoute()

const nav = computed(() => [
  { to: '/provider', label: 'Bookings', icon: CalendarCheck, count: requests.value.length },
  { to: '/provider/listing', label: 'Your listing', icon: Store, count: 0 },
])
const item = 'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold no-underline transition-colors'
</script>

<template>
  <div class="flex h-full flex-col gap-5 overflow-y-auto p-3">
    <div class="flex items-center gap-2 px-1 pt-2">
      <AppLogo />
      <span class="rounded-full bg-marigold px-1.5 py-0.5 text-[9px] font-bold tracking-[.06em] text-on-marigold uppercase">Care</span>
      <SheetClose v-if="props.inSheet" as-child>
        <button type="button" class="ml-auto grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-[1.5px] border-line-strong bg-transparent text-ink hover:border-ink" aria-label="Close menu">
          <X class="size-4" aria-hidden="true" />
        </button>
      </SheetClose>
    </div>

    <!-- The listing this person manages -->
    <div v-if="membership" class="flex items-center gap-2.5 rounded-lg bg-canvas p-2 ring-1 ring-line">
      <img v-if="listing?.photo" :src="listing.photo" alt="" class="size-9 shrink-0 rounded-lg object-cover">
      <CareProviderIcon v-else :type="membership.type" class="size-9! shrink-0" />
      <span class="min-w-0 flex-1">
        <strong class="block truncate text-[13px] leading-4">{{ membership.name }}</strong>
        <span class="flex items-center gap-1.5 text-xs text-ink-muted">
          <span :class="['size-1.5 rounded-full', listing?.takingBookings === false ? 'bg-ash' : 'bg-marigold']" aria-hidden="true" />
          {{ careTypes[membership.type].label }} · {{ listing?.takingBookings === false ? 'Paused' : 'Taking bookings' }}
        </span>
      </span>
    </div>

    <nav aria-label="Provider dashboard" class="flex shrink-0 flex-col gap-1">
      <span class="px-3 pb-1 text-[11px] font-bold tracking-[.1em] text-ink-muted uppercase">Your practice</span>
      <NuxtLink
        v-for="n in nav"
        :key="n.to"
        :to="n.to"
        :aria-current="route.path === n.to ? 'page' : undefined"
        :class="[item, route.path === n.to ? 'bg-ink text-canvas' : 'text-ink-muted hover:bg-canvas hover:text-ink']"
      >
        <span v-if="route.path === n.to" class="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-marigold" aria-hidden="true" />
        <component :is="n.icon" class="size-[18px]" aria-hidden="true" />
        <span class="flex-1">{{ n.label }}</span>
        <span v-if="n.count" class="grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1.5 text-[11px] font-bold text-on-marigold">{{ n.count }}</span>
      </NuxtLink>
      <NuxtLink v-if="membership" :to="`/care/${membership.slug}`" target="_blank" :class="[item, 'text-ink-muted hover:bg-canvas hover:text-ink']">
        <ExternalLink class="size-[18px]" aria-hidden="true" /><span class="flex-1">Public page</span>
      </NuxtLink>
    </nav>

    <!-- Foot: who's signed in, the buyer account, the theme -->
    <div class="mt-auto flex shrink-0 flex-col gap-3 border-t border-line pt-4">
      <div v-if="user" class="flex items-center gap-3 px-2">
        <AccountAvatar :initials="initials" class="size-9 text-xs" />
        <span class="flex min-w-0 flex-col">
          <strong class="truncate text-sm leading-5">{{ user.name }}</strong>
          <span class="truncate text-xs text-ink-muted">{{ user.email }}</span>
        </span>
      </div>
      <ProviderSwitchCard to="buyer" compact @switch="switchTo('buyer')" />
      <button type="button" class="flex cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-canvas hover:text-ink" @click="signOut()">
        <LogOut class="size-[18px]" aria-hidden="true" />Sign out
      </button>
      <ThemeToggle variant="segmented" fit />
    </div>
  </div>
</template>
