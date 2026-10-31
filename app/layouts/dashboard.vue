<script setup lang="ts">
import { Bell, Menu, Plus, Search } from '@lucide/vue'

// Store dashboard: fixed sidebar, slim top bar, no public header or footer.
// Pages set their title with definePageMeta({ layout: 'dashboard', title: '…' }).
const route = useRoute()
const title = computed(() => (route.meta.title as string | undefined)
  ?? dashboardSections[String(route.params.section)]?.title
  ?? 'Dashboard')
const navOpen = ref(false)
const { can, store } = useStoreContext()
const { unread } = useStoreInbox()
const canAddDogs = computed(() => can('dogs'))
watch(() => route.fullPath, () => { navOpen.value = false })
</script>

<template>
  <div class="min-h-screen bg-canvas lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
    <a href="#main" class="absolute -top-15 left-4 z-30 rounded-md bg-marigold px-3.5 py-2.5 font-bold text-on-marigold focus:top-3">Skip to content</a>

    <!-- Sidebar -->
    <aside class="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">
      <DashboardNav />
    </aside>

    <div class="flex min-w-0 flex-col">
      <!-- Top bar -->
      <header class="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur-sm">
        <div class="flex h-16 items-center gap-3 px-4 sm:px-8">
          <Sheet v-model:open="navOpen">
            <SheetTrigger as-child>
              <Button variant="outline" size="icon" class="border-[1.5px] border-line-strong lg:hidden" aria-label="Open menu">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" hide-close class="w-[264px] border-line bg-surface p-0">
              <SheetTitle class="sr-only">Dashboard menu</SheetTitle>
              <SheetDescription class="sr-only">Store dashboard sections</SheetDescription>
              <DashboardNav in-sheet />
            </SheetContent>
          </Sheet>

          <div class="flex min-w-0 flex-col">
            <span class="hidden truncate font-mono text-[10px] font-semibold tracking-[.12em] text-ink-muted uppercase sm:block">{{ store.name }}</span>
            <h1 class="m-0 truncate font-display text-xl leading-6 font-extrabold font-stretch-expanded">{{ title }}</h1>
          </div>

          <label class="ml-auto hidden h-10 w-full max-w-[320px] min-w-0 items-center gap-2 rounded-full bg-surface px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-ink md:flex">
            <Search class="size-4 text-ink-muted" aria-hidden="true" />
            <span class="sr-only">Search the dashboard</span>
            <input type="search" placeholder="Search dogs, enquiries, bookings" class="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-ink-muted">
          </label>

          <div class="ml-auto flex items-center gap-2 md:ml-0">
            <Button as-child variant="outline" size="icon" class="relative border-[1.5px] border-line-strong">
              <NuxtLink to="/dashboard/inbox" :aria-label="`Inbox${unread ? `, ${unread} unread` : ''}`">
                <Bell aria-hidden="true" />
                <span v-if="unread" class="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1 text-[11px] font-bold text-on-marigold ring-2 ring-canvas" aria-hidden="true">{{ unread }}</span>
              </NuxtLink>
            </Button>
            <Button v-if="canAddDogs" as-child variant="marigold" size="sm" class="hidden sm:inline-flex">
              <NuxtLink to="/dashboard/dogs"><Plus aria-hidden="true" />Add a dog</NuxtLink>
            </Button>
          </div>
        </div>
      </header>

      <main id="main" class="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 sm:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
