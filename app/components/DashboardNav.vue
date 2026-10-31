<script setup lang="ts">
import { X } from '@lucide/vue'
import {
  CalendarDays, ChevronsUpDown, Dog, ExternalLink, LayoutDashboard, LogOut, MessageSquare,
  Settings, ShoppingBag, Stethoscope, Store, Users, Wallet,
} from '@lucide/vue'
import type { Component } from 'vue'

// Sidebar contents for the store dashboard; used in the desktop sidebar and the phone sheet.
// The whole column scrolls on short screens, so the sections are never squeezed out.
const props = defineProps<{ inSheet?: boolean }>()
const { store, roleLabel, can } = useStoreContext()
const { user, initials, signOut } = useSession()
const { unread } = useStoreInbox()
const badgeOf = (to: string) => (to === '/dashboard/inbox' ? unread.value : 0)
// Only the sections this person's role allows
const nav = computed(() => dashboardNav
  .map(g => ({ ...g, items: g.items.filter(i => !i.permission || can(i.permission)) }))
  .filter(g => g.items.length))
const icons: Record<string, Component> = { LayoutDashboard, Dog, MessageSquare, CalendarDays, Stethoscope, Store, Wallet, Users, Settings }
const route = useRoute()

function isActive(to: string) {
  return to === '/dashboard' ? route.path === '/dashboard' : route.path.startsWith(to)
}
</script>

<template>
  <div class="flex h-full flex-col gap-5 overflow-y-auto p-3">
    <div class="flex items-center gap-2 px-1 pt-2">
      <AppLogo />
      <span class="rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-bold tracking-[.06em] text-canvas uppercase">Store</span>
      <SheetClose v-if="props.inSheet" as-child>
        <button type="button" class="ml-auto grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-[1.5px] border-line-strong bg-transparent text-ink hover:border-ink" aria-label="Close menu">
          <X class="size-4" aria-hidden="true" />
        </button>
      </SheetClose>
    </div>

    <!-- Store switcher -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button type="button" class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-canvas p-2 text-left ring-1 ring-line hover:ring-ink">
          <StoreAvatar :initials="store.initials" class="size-9 shrink-0 rounded-lg" />
          <span class="min-w-0 flex-1">
            <strong class="block text-[13px] leading-4">{{ store.name }}</strong>
            <span class="flex items-center gap-1.5 text-xs text-ink-muted"><span class="size-1.5 rounded-full bg-marigold" aria-hidden="true" />{{ store.verified ? 'Inspected' : 'In review' }} · {{ roleLabel }}</span>
          </span>
          <ChevronsUpDown class="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-[var(--reka-dropdown-menu-trigger-width)] border-line bg-surface">
        <DropdownMenuLabel class="text-xs text-ink-muted">Signed in as {{ user?.name }}</DropdownMenuLabel>
        <DropdownMenuItem as-child>
          <NuxtLink :to="`/stores/${store.slug}`" class="cursor-pointer"><ExternalLink aria-hidden="true" />View public store</NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuItem as-child>
          <NuxtLink to="/dogs" class="cursor-pointer"><ShoppingBag aria-hidden="true" />Switch to buying</NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="cursor-pointer" @select="signOut">
          <LogOut aria-hidden="true" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <nav aria-label="Dashboard" class="flex shrink-0 flex-col gap-6">
      <div v-for="group in nav" :key="group.group" class="flex flex-col gap-1">
        <span class="px-3 pb-1 text-[11px] font-bold tracking-[.1em] text-ink-muted uppercase">{{ group.group }}</span>
        <NuxtLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          :class="[
            'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold no-underline transition-colors',
            isActive(item.to) ? 'bg-ink text-canvas' : 'text-ink-muted hover:bg-canvas hover:text-ink',
          ]"
        >
          <span v-if="isActive(item.to)" class="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-marigold" aria-hidden="true" />
          <component :is="icons[item.icon]" class="size-[18px]" aria-hidden="true" />
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="badgeOf(item.to)" class="grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1.5 text-[11px] font-bold text-on-marigold">{{ badgeOf(item.to) }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Footer: who's signed in, the way back to buying, and the theme -->
    <div class="mt-auto flex shrink-0 flex-col gap-3 border-t border-line pt-4">
      <div v-if="user" class="flex items-center gap-3 px-2">
        <AccountAvatar :initials="initials" store class="size-9 text-xs" />
        <span class="flex min-w-0 flex-col">
          <strong class="truncate text-sm leading-5">{{ user.name }}</strong>
          <span class="text-xs text-ink-muted">{{ roleLabel }}</span>
        </span>
      </div>
      <div class="flex flex-col gap-0.5">
        <NuxtLink to="/" class="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-ink-muted no-underline hover:bg-canvas hover:text-ink">
          <ShoppingBag class="size-[18px]" aria-hidden="true" />Switch to buying
        </NuxtLink>
        <NuxtLink :to="`/stores/${store.slug}`" class="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-ink-muted no-underline hover:bg-canvas hover:text-ink">
          <ExternalLink class="size-[18px]" aria-hidden="true" />View public store
        </NuxtLink>
      </div>
      <ThemeToggle variant="segmented" fit />
    </div>
  </div>
</template>
