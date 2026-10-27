<script setup lang="ts">
import { LogOut } from '@lucide/vue'
import { cn } from '~/lib/utils'

// The account area's navigation: a sidebar with who you are on wide screens, a row of tabs on phones
const { user, initials, signOut } = useSession()
const route = useRoute()

// Overview only matches itself; other sections also match their sub-pages (a dog's record under My dogs)
const isActive = (to: string) => to === '/account' ? route.path === to : route.path.startsWith(to)
const items = accountNav.flatMap(g => g.items)
</script>

<template>
  <!-- Phones: one scrolling row of tabs -->
  <nav aria-label="Account" class="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :class="cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-2 text-sm font-semibold whitespace-nowrap no-underline',
        isActive(item.to) ? 'border-ink bg-ink text-canvas' : 'border-line-strong text-ink',
        item.soon && !isActive(item.to) && 'text-ink-muted',
      )"
    >
      <component :is="item.icon" class="size-4" aria-hidden="true" />{{ item.label }}
    </NuxtLink>
  </nav>

  <!-- Wide screens: sidebar -->
  <aside v-if="user" class="sticky top-[calc(var(--header-height)+16px)] hidden flex-col gap-5 self-start lg:flex">
    <div class="flex items-center gap-3 rounded-lg bg-surface p-3 ring-1 ring-line">
      <AccountAvatar :initials="initials" class="size-11 text-[15px]" />
      <div class="flex min-w-0 flex-col">
        <strong class="truncate text-sm leading-5">{{ user.name }}</strong>
        <span class="truncate font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">Buyer · {{ user.id }}</span>
      </div>
    </div>

    <nav aria-label="Account" class="flex flex-col gap-5">
      <div v-for="group in accountNav" :key="group.group" class="flex flex-col gap-0.5">
        <span class="px-3 pb-1.5 font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ group.group }}</span>
        <NuxtLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          :class="cn(
            'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold no-underline',
            isActive(item.to) ? 'bg-surface text-ink ring-1 ring-line' : 'text-ink-muted hover:bg-surface-sunk hover:text-ink',
          )"
        >
          <span v-if="isActive(item.to)" class="absolute top-2 bottom-2 left-0 w-1 rounded-r-full bg-marigold" aria-hidden="true" />
          <component :is="item.icon" class="size-[18px]" aria-hidden="true" />
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="item.soon" class="font-mono text-[9.5px] font-semibold tracking-[.1em] uppercase opacity-70">Soon</span>
        </NuxtLink>
      </div>
    </nav>

    <button type="button" class="flex cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent px-3 py-2 text-left text-sm font-semibold text-ink-muted hover:bg-surface-sunk hover:text-ink" @click="signOut">
      <LogOut class="size-[18px]" aria-hidden="true" />Sign out
    </button>
  </aside>
</template>
