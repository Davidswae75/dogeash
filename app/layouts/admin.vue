<script setup lang="ts">
import { Menu, ShieldCheck } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from '#imports' // nuxt

// The admin console's frame, deliberately unlike the marketplace: a dark sidebar fixed down the full height
// of the screen (a drawer on phones), and the work area filling the rest of the width.
// The sections show once the one-time code is done.
const route = useRoute()
const locked = computed(() => route.path === '/admin/verify')
const drawer = ref(false)
</script>

<template>
  <div class="min-h-dvh bg-canvas text-ink lg:pl-64">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
      <AdminSidebar :locked="locked" />
    </aside>

    <!-- Phones and tablets: a slim bar that opens the sidebar as a drawer -->
    <header class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur lg:hidden">
      <Sheet v-model:open="drawer">
        <SheetTrigger as-child>
          <Button variant="ghost" size="icon" aria-label="Open admin menu"><Menu aria-hidden="true" /></Button>
        </SheetTrigger>
        <!-- The menu covers the whole screen on phones; its own close button sits top right -->
        <SheetContent side="left" class="w-full! max-w-none! border-0 p-0 [&>button]:text-on-night">
          <SheetTitle class="sr-only">Admin menu</SheetTitle>
          <AdminSidebar :locked="locked" @navigate="drawer = false" />
        </SheetContent>
      </Sheet>
      <span class="flex items-center gap-2 text-sm font-semibold"><ShieldCheck class="size-4" aria-hidden="true" />Dogeash admin</span>
    </header>

    <main class="w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-9 2xl:px-14">
      <slot />
    </main>
  </div>
</template>
