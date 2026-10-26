<script setup lang="ts">
import {
  CalendarDays, ChevronsUpDown, Dog, ExternalLink, LayoutDashboard, LogOut, MessageSquare,
  Settings, ShoppingBag, Stethoscope, Store, Users, Wallet,
} from '@lucide/vue'
import type { Component } from 'vue'

// Sidebar contents for the store dashboard; used in the desktop sidebar and the phone sheet
const store = sampleStores[0]!
const icons: Record<string, Component> = { LayoutDashboard, Dog, MessageSquare, CalendarDays, Stethoscope, Store, Wallet, Users, Settings }
const route = useRoute()

function isActive(to: string) {
  return to === '/dashboard' ? route.path === '/dashboard' : route.path.startsWith(to)
}
</script>

<template>
  <div class="flex h-full flex-col gap-6 p-4">
    <div class="flex items-center justify-between px-2 pt-2">
      <AppLogo />
      <span class="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold tracking-[.08em] text-canvas uppercase">Store</span>
    </div>

    <!-- Store switcher -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button type="button" class="flex w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-canvas p-2.5 text-left ring-1 ring-line hover:ring-ink">
          <StoreAvatar :initials="store.initials" class="size-10 rounded-xl" />
          <span class="min-w-0 flex-1">
            <strong class="block truncate text-sm">{{ store.name }}</strong>
            <span class="flex items-center gap-1.5 text-xs text-ink-muted"><span class="size-1.5 rounded-full bg-marigold" aria-hidden="true" />Inspected · Owner</span>
          </span>
          <ChevronsUpDown class="size-4 text-ink-muted" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-[var(--reka-dropdown-menu-trigger-width)] border-line bg-surface">
        <DropdownMenuLabel class="text-xs text-ink-muted">Signed in as Ibrahim Danjuma</DropdownMenuLabel>
        <DropdownMenuItem as-child>
          <NuxtLink :to="`/stores/${store.slug}`" class="cursor-pointer"><ExternalLink aria-hidden="true" />View public store</NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuItem as-child>
          <NuxtLink to="/dogs" class="cursor-pointer"><ShoppingBag aria-hidden="true" />Switch to buying</NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem as-child>
          <NuxtLink to="/sign-in" class="cursor-pointer"><LogOut aria-hidden="true" />Sign out</NuxtLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <nav aria-label="Dashboard" class="flex flex-1 flex-col gap-6 overflow-y-auto">
      <div v-for="group in dashboardNav" :key="group.group" class="flex flex-col gap-1">
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
          <span v-if="isActive(item.to)" class="absolute top-2 bottom-2 -left-4 w-1 rounded-r-full bg-marigold" aria-hidden="true" />
          <component :is="icons[item.icon]" class="size-[18px]" aria-hidden="true" />
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="'badge' in item" class="grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1.5 text-[11px] font-bold text-on-marigold">{{ item.badge }}</span>
        </NuxtLink>
      </div>
    </nav>

    <div class="px-3 sm:hidden"><ThemeToggle variant="segmented" /></div>
    <NuxtLink :to="`/stores/${store.slug}`" class="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold text-ink-muted no-underline hover:bg-canvas hover:text-ink">
      <ExternalLink class="size-[18px]" aria-hidden="true" />View public store
    </NuxtLink>
  </div>
</template>
