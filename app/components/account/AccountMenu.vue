<script setup lang="ts">
import { LogOut } from '@lucide/vue'

// The avatar in the header: who is signed in, their account pages and Sign out
const { user, initials, memberships, hasStore, signOut } = useSession()
const { count } = useShortlist()

const groups = accountNav.map(g => g.items.filter(i => i.inMenu)).filter(g => g.length)
</script>

<template>
  <DropdownMenu v-if="user">
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="cursor-pointer rounded-full border-0 bg-transparent p-0 ring-offset-2 ring-offset-canvas transition-shadow hover:ring-2 hover:ring-ink data-[state=open]:ring-2 data-[state=open]:ring-ink"
        :aria-label="`Your account, ${user.name}`"
      >
        <AccountAvatar :initials="initials" :store="hasStore" />
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" :side-offset="10" class="w-[288px] rounded-lg border-line bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
      <div class="flex items-center gap-3 px-2.5 pt-2 pb-3">
        <AccountAvatar :initials="initials" class="size-11 text-[15px]" />
        <div class="flex min-w-0 flex-col">
          <strong class="truncate font-display text-[15px] leading-5 font-extrabold font-stretch-expanded">{{ user.name }}</strong>
          <span class="truncate text-[13px] text-ink-muted">{{ user.email }}</span>
          <span class="mt-1 font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">Buyer · {{ user.city }} · {{ user.id }}</span>
        </div>
      </div>

      <!-- Store members: their store first, one click into the dashboard -->
      <div v-for="m in memberships" :key="m.storeId" class="px-1 pb-2">
        <AccountStoreCard :store="m.store" :role="m.role" />
      </div>

      <template v-for="(group, g) in groups" :key="g">
        <DropdownMenuSeparator class="bg-line" />
        <DropdownMenuGroup>
          <DropdownMenuItem v-for="item in group" :key="item.to" as-child class="h-9 cursor-pointer gap-3 px-2.5 font-semibold">
            <NuxtLink :to="item.to" :class="item.soon ? 'text-ink-muted no-underline' : 'text-ink no-underline'">
              <component :is="item.icon" class="size-[17px] text-current" aria-hidden="true" />
              <span class="flex-1">{{ item.label }}</span>
              <span v-if="item.soon" class="rounded-full bg-surface-sunk px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[.08em] uppercase">Soon</span>
              <ClientOnly>
                <span v-if="item.to === '/shortlist' && count" class="grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1.5 text-[11px] font-bold text-on-marigold">{{ count }}</span>
              </ClientOnly>
            </NuxtLink>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </template>

      <DropdownMenuSeparator class="bg-line" />
      <DropdownMenuItem class="h-9 cursor-pointer gap-3 px-2.5 font-semibold" @select="signOut">
        <LogOut class="size-[17px] text-ink" aria-hidden="true" />Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
