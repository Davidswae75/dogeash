<script setup lang="ts">
import { CalendarClock, Search, ClipboardCheck, Dog, FileCheck2, Flag, LayoutDashboard, LogOut, Megaphone, RefreshCcw, ScrollText, Settings, ShieldCheck, Star, Stethoscope, Store, Users, Wallet } from '@lucide/vue'
import type { Component } from 'vue'
import { computed, onMounted } from 'vue'
import { useRoute, useState } from '#imports' // nuxt
import { useAdmin } from '~/composables/useAdmin'
import { useAdminReports } from '~/composables/useAdminReports'
import { useSession } from '~/composables/useSession'
import { useStaff } from '~/composables/useStaff'
import { adminNav, badgeMeaning } from '~/utils/admin'

// The admin sidebar: the sections in three groups with what's waiting in each, then who's signed in.
// Dark in both themes, so the admin dashboard never looks like the marketplace. Used as a fixed column on
// wide screens and inside a drawer on phones. `locked` hides the sections until the one-time code is done.
const props = defineProps<{ locked?: boolean }>()
const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()
const { user, initials, signOut } = useSession()
const { role } = useStaff()
const { overview, loadOverview } = useAdmin()
const { openCount, loadCount } = useAdminReports()
// The waiting counts beside sections come from the overview; load it on any admin page
onMounted(() => {
  if (props.locked || role.value !== 'admin') return
  if (!overview.value) loadOverview()
  loadCount()
})

const searchOpen = useState('admin-search-open', () => false)
const icons: Record<string, Component> = { Settings, Megaphone, RefreshCcw, CalendarClock, Flag, LayoutDashboard, ScrollText, FileCheck2, ClipboardCheck, Dog, Star, Store, Users, Stethoscope, Wallet }
// Inspectors see only the sections open to them
const groups = computed(() => adminNav
  .map(g => ({ ...g, items: g.items.filter(i => role.value === 'admin' || i.inspector) }))
  .filter(g => g.items.length))
const isActive = (to?: string) => !!to && (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))
const badgeOf = (key?: 'storesInReview' | 'dogsPendingReview' | 'visitsUnanswered' | 'reports') => (!key ? 0 : key === 'reports' ? openCount.value : overview.value ? overview.value.waiting[key] : 0)
</script>

<template>
  <div class="flex h-full flex-col bg-night text-on-night">
    <NuxtLink to="/admin" class="flex items-center gap-2.5 px-5 pt-5 pb-6 text-inherit no-underline" @click="emit('navigate')">
      <span class="grid size-8 place-items-center rounded-lg bg-marigold text-on-marigold"><ShieldCheck class="size-[18px]" aria-hidden="true" /></span>
      <span class="flex flex-col leading-tight">
        <strong class="text-[15px] font-semibold tracking-tight">Dogeash</strong>
        <span class="font-mono text-[10.5px] tracking-[.14em] text-on-night/55 uppercase">Admin console</span>
      </span>
    </NuxtLink>

    <button v-if="!props.locked && role === 'admin'" type="button" class="mx-3 mb-4 flex cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-on-night/[.06] px-3 py-2 text-left text-[13px] text-on-night/60 hover:bg-on-night/10 hover:text-on-night" @click="searchOpen = true; emit('navigate')">
      <Search class="size-4" aria-hidden="true" /><span class="flex-1">Search</span><kbd class="rounded border border-on-night/20 px-1.5 font-mono text-[10px]">⌘K</kbd>
    </button>
    <nav v-if="!props.locked" class="flex flex-1 flex-col gap-5 overflow-y-auto px-3" aria-label="Admin sections">
      <div v-for="g in groups" :key="g.group" class="flex flex-col gap-0.5">
        <span class="px-2.5 pb-1 font-mono text-[10px] tracking-[.14em] text-on-night/40 uppercase">{{ g.group }}</span>
        <template v-for="item in g.items" :key="item.label">
          <NuxtLink
            v-if="item.to"
            :to="item.to"
            :class="['group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] no-underline transition-colors', isActive(item.to) ? 'bg-on-night/[.08] text-on-night' : 'text-on-night/70 hover:bg-on-night/[.04] hover:text-on-night']"
            @click="emit('navigate')"
          >
            <span v-if="isActive(item.to)" class="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-marigold" aria-hidden="true" />
            <component :is="icons[item.icon]" class="size-[17px] shrink-0" aria-hidden="true" />
            {{ item.label }}
            <span v-if="badgeOf(item.badge)" :title="badgeMeaning[item.badge!](badgeOf(item.badge))" :aria-label="badgeMeaning[item.badge!](badgeOf(item.badge))" class="ml-auto rounded-full bg-marigold px-1.5 font-mono text-[10.5px] leading-[18px] font-semibold text-on-marigold">{{ badgeOf(item.badge) }}</span>
          </NuxtLink>
          <span v-else class="flex h-9 cursor-default items-center gap-3 rounded-lg px-2.5 text-[13.5px] text-on-night/30" title="Coming next">
            <component :is="icons[item.icon]" class="size-[17px] shrink-0" aria-hidden="true" />
            {{ item.label }}
            <span v-if="badgeOf(item.badge)" :title="badgeMeaning[item.badge!](badgeOf(item.badge))" :aria-label="badgeMeaning[item.badge!](badgeOf(item.badge))" class="ml-auto rounded-full bg-on-night/10 px-1.5 font-mono text-[10.5px] leading-[18px] text-on-night/70">{{ badgeOf(item.badge) }}</span>
            <span v-else class="ml-auto font-mono text-[9.5px] tracking-[.1em] uppercase">soon</span>
          </span>
        </template>
      </div>
    </nav>
    <div v-else class="flex-1" />

    <div class="m-3 flex items-center gap-3 rounded-xl bg-on-night/[.06] p-3">
      <span class="grid size-9 shrink-0 place-items-center rounded-full bg-marigold text-[13px] font-bold text-on-marigold">{{ initials }}</span>
      <span class="flex min-w-0 flex-1 flex-col leading-tight">
        <strong class="truncate text-[13px] font-semibold text-on-night">{{ user?.name || user?.email }}</strong>
        <span class="font-mono text-[10.5px] tracking-[.1em] text-on-night/55 uppercase">{{ role }}</span>
      </span>
      <button type="button" class="grid size-8 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-on-night/70 hover:bg-on-night/10 hover:text-on-night" aria-label="Sign out" @click="signOut('Your admin session has ended. You\'ll need a new one-time code next time.')">
        <LogOut class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
