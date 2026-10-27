<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
const links = [
  { label: 'Find a guard dog', to: '/dogs' },
  { label: 'Protection levels', to: '/protection-levels' },
  { label: 'Stores', to: '/stores' },
  { label: "Buyer's guide", to: '/guide' },
]

const { user, initials, memberships, hasStore, signOut } = useSession()
const menuOpen = ref(false)
const route = useRoute()
useEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Escape') menuOpen.value = false })
// Links slide in one after another; the account row comes last
const stagger = (i: number) => ({ animationDelay: `${80 + i * 45}ms` })
const lastDelay = computed(() => stagger(links.length + 1))
// Signing in from the header brings you back to the page you were on
const signInQuery = computed(() => (['/', '/sign-in', '/sign-up'].includes(route.path) ? {} : { redirect: route.fullPath }))
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <header class="sticky top-[env(safe-area-inset-top,0px)] z-20 bg-canvas">
    <div class="mx-auto flex h-header max-w-[calc(var(--container)+64px)] items-center gap-4 px-4 xl:gap-8 xl:px-8">
      <AppLogo />

      <nav class="hidden gap-6 text-[15px] font-semibold xl:flex" aria-label="Main">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="py-1 whitespace-nowrap text-ink-muted no-underline hover:text-ink hover:shadow-[0_3px_0_var(--marigold)] [&.router-link-active]:text-ink [&.router-link-active]:shadow-[0_3px_0_var(--marigold)]"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex items-center gap-2.5">
        <ShortlistLink />
        <!-- Signed in: the marketplace header. Bell and avatar in place of Sign in and Open a store. -->
        <template v-if="user">
          <AccountStorePill />
          <AccountNotifications />
          <span class="hidden sm:inline-flex"><ThemeToggle /></span>
          <AccountMenu />
        </template>
        <template v-else>
          <!-- Phones: the theme switch lives in the menu, so Sign in always fits -->
          <span class="hidden sm:inline-flex"><ThemeToggle /></span>
          <Button as-child variant="ghost" size="sm" class="px-2.5 sm:px-3">
            <NuxtLink :to="{ path: '/sign-in', query: signInQuery }">Sign in</NuxtLink>
          </Button>
          <Button as-child size="sm" class="hidden xl:inline-flex">
            <NuxtLink to="/open-a-store">Open a store</NuxtLink>
          </Button>
        </template>
        <Button
          variant="outline"
          size="icon"
          class="border-[1.5px] border-line-strong xl:hidden"
          :aria-expanded="menuOpen"
          aria-controls="dg-mobile-nav"
          :aria-label="menuOpen ? 'Close menu' : 'Menu'"
          @click="menuOpen = !menuOpen"
        >
          <!-- Three lines that fold into an X -->
          <span class="relative block h-3.5 w-5" aria-hidden="true">
            <span :class="['absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-calm', menuOpen ? 'top-1.5 rotate-45' : 'top-0']" />
            <span :class="['absolute top-1.5 left-0 h-0.5 rounded-full bg-current transition-all duration-200 ease-calm', menuOpen ? 'w-0 opacity-0' : 'w-3.5']" />
            <span :class="['absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-calm', menuOpen ? 'top-1.5 -rotate-45' : 'top-3']" />
          </span>
        </Button>
      </div>
    </div>

    <!-- Phone menu: the drawer opens to its height, a hazard stripe draws across, then the links slide in one by one -->
    <div
      id="dg-mobile-nav"
      :class="['grid transition-[grid-template-rows] duration-300 ease-calm xl:hidden', menuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]']"
      :inert="!menuOpen"
    >
      <div class="overflow-hidden">
        <span :class="['block h-1 origin-left hazard-thin transition-transform duration-500 ease-calm', menuOpen ? 'scale-x-100' : 'scale-x-0']" aria-hidden="true" />
        <nav class="flex flex-col gap-1 px-4 pt-2 pb-5" aria-label="Main">
          <NuxtLink
            v-for="(link, i) in links"
            :key="link.to"
            :to="link.to"
            :class="['group flex items-center justify-between py-2.5 font-display text-[22px] leading-[1.2] font-extrabold text-ink no-underline [font-stretch:112%] [&.router-link-active]:text-marigold-ink', menuOpen && 'animate-menu-in']"
            :style="stagger(i)"
          >
            {{ link.label }}
            <ArrowRight class="size-5 text-ink-muted transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </NuxtLink>
          <div :class="menuOpen && 'animate-menu-in'" :style="stagger(links.length)">
            <ThemeToggle variant="segmented" />
          </div>
          <div v-if="user" :class="['mt-3 flex items-center gap-3 rounded-lg bg-surface p-3 ring-1 ring-line', menuOpen && 'animate-menu-in']" :style="lastDelay">
            <AccountAvatar :initials="initials" :store="hasStore" />
            <span class="flex min-w-0 flex-1 flex-col">
              <strong class="truncate text-sm">{{ user.name }}</strong>
              <span class="truncate text-[13px] text-ink-muted">{{ user.email }}</span>
            </span>
            <Button variant="outline" size="sm" @click="signOut">Sign out</Button>
          </div>
          <div v-for="m in memberships" :key="m.storeId" :class="menuOpen && 'animate-menu-in'" :style="lastDelay">
            <AccountStoreCard :store="m.store" :role="m.role" />
          </div>
          <div v-if="!user" :class="['mt-3 flex gap-2', menuOpen && 'animate-menu-in']" :style="lastDelay">
            <Button as-child variant="outline" size="sm"><NuxtLink to="/sign-in">Sign in</NuxtLink></Button>
            <Button as-child size="sm"><NuxtLink to="/open-a-store">Open a store</NuxtLink></Button>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>
