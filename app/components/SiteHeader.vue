<script setup lang="ts">
const links = [
  { label: 'Find a guard dog', to: '/dogs' },
  { label: 'Protection levels', to: '/protection-levels' },
  { label: 'Stores', to: '/stores' },
  { label: "Buyer's guide", to: '/guide' },
]

const { user, initials, signOut } = useSession()
const menuOpen = ref(false)
const route = useRoute()
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
          <AccountNotifications />
          <span class="hidden sm:inline-flex"><ThemeToggle /></span>
          <AccountMenu />
        </template>
        <template v-else>
          <ThemeToggle />
          <Button as-child variant="ghost" size="sm" class="hidden xl:inline-flex">
            <NuxtLink to="/sign-in">Sign in</NuxtLink>
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
          aria-label="Menu"
          @click="menuOpen = !menuOpen"
        >
          <AppIcon name="menu" :size="22" />
        </Button>
      </div>
    </div>

    <nav
      v-show="menuOpen"
      id="dg-mobile-nav"
      class="flex flex-col gap-1 border-t border-line px-4 pt-2 pb-5 xl:hidden!"
      aria-label="Main"
    >
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="py-2.5 font-display text-[22px] leading-[1.2] font-extrabold text-ink no-underline [font-stretch:112%]"
      >
        {{ link.label }}
      </NuxtLink>
      <ThemeToggle variant="segmented" />
      <div v-if="user" class="mt-3 flex items-center gap-3 rounded-lg bg-surface p-3 ring-1 ring-line">
        <AccountAvatar :initials="initials" />
        <span class="flex min-w-0 flex-1 flex-col">
          <strong class="truncate text-sm">{{ user.name }}</strong>
          <span class="truncate text-[13px] text-ink-muted">{{ user.email }}</span>
        </span>
        <Button variant="outline" size="sm" @click="signOut">Sign out</Button>
      </div>
      <div v-else class="mt-3 flex gap-2">
        <Button as-child variant="outline" size="sm"><NuxtLink to="/sign-in">Sign in</NuxtLink></Button>
        <Button as-child size="sm"><NuxtLink to="/open-a-store">Open a store</NuxtLink></Button>
      </div>
    </nav>
  </header>
</template>
