<script setup lang="ts">
import { CalendarCheck, ExternalLink, LogOut, Store } from '@lucide/vue'
import { useAccountMode } from '~/composables/useAccountMode'
import { useProviderDashboard } from '~/composables/useProviderDashboard'
import { useSession } from '~/composables/useSession'
import { careTypes } from '~/utils/care'

// The avatar in the provider dashboard's top bar: only what a provider needs (bookings, the listing, the
// public page), the switch to the buyer account, and Sign out. The buyer pages live in the buyer account.
const { user, initials, signOut } = useSession()
const { membership, requests } = useProviderDashboard()
const { switchTo } = useAccountMode()
const row = 'h-9 cursor-pointer gap-3 px-2.5 font-semibold'
</script>

<template>
  <DropdownMenu v-if="user">
    <DropdownMenuTrigger as-child>
      <button type="button" class="cursor-pointer rounded-full border-0 bg-transparent p-0 ring-offset-2 ring-offset-canvas transition-shadow hover:ring-2 hover:ring-ink data-[state=open]:ring-2 data-[state=open]:ring-ink" :aria-label="`Your account, ${user.name}`">
        <AccountAvatar :initials="initials" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" :side-offset="10" class="w-[288px] rounded-lg border-line bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
      <div class="flex items-center gap-3 px-2.5 pt-2 pb-3">
        <AccountAvatar :initials="initials" class="size-11 text-[15px]" />
        <div class="flex min-w-0 flex-col">
          <strong class="truncate font-display text-[15px] leading-5 font-extrabold font-stretch-expanded">{{ user.name }}</strong>
          <span class="truncate text-[13px] text-ink-muted">{{ user.email }}</span>
          <span v-if="membership" class="mt-1 truncate font-mono text-[10.5px] font-semibold tracking-[.12em] text-marigold-ink uppercase">{{ careTypes[membership.type].label }} · {{ membership.name }}</span>
        </div>
      </div>
      <DropdownMenuSeparator class="bg-line" />
      <DropdownMenuGroup>
        <DropdownMenuItem as-child :class="row">
          <NuxtLink to="/provider" class="text-ink no-underline">
            <CalendarCheck class="size-[17px]" aria-hidden="true" /><span class="flex-1">Bookings</span>
            <span v-if="requests.length" class="grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1.5 text-[11px] font-bold text-on-marigold">{{ requests.length }}</span>
          </NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuItem as-child :class="row">
          <NuxtLink to="/provider/listing" class="text-ink no-underline"><Store class="size-[17px]" aria-hidden="true" />Your listing</NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuItem v-if="membership" as-child :class="row">
          <NuxtLink :to="`/care/${membership.slug}`" target="_blank" class="text-ink no-underline"><ExternalLink class="size-[17px]" aria-hidden="true" />Public page</NuxtLink>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator class="bg-line" />
      <div class="p-1">
        <ProviderSwitchCard to="buyer" @switch="switchTo('buyer')" />
      </div>
      <DropdownMenuSeparator class="bg-line" />
      <DropdownMenuItem :class="row" @select="signOut()"><LogOut class="size-[17px] text-ink" aria-hidden="true" />Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
