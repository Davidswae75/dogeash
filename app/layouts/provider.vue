<script setup lang="ts">
import { Menu, Pencil } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from '#imports' // nuxt
import { useAccountMode } from '~/composables/useAccountMode'
import { useProviderDashboard } from '~/composables/useProviderDashboard'

// Provider dashboard: its own sidebar and slim top bar, no public header or footer (like the store dashboard,
// in the provider's colours). Pages set their title with definePageMeta({ title: '…' }).
const route = useRoute()
const title = computed(() => (route.meta.title as string | undefined) ?? 'Provider dashboard')
const navOpen = ref(false)
const dash = useProviderDashboard()
const { membership } = dash
const { enterProvider } = useAccountMode()
onMounted(() => {
  enterProvider()
  dash.load()
})
watch(() => route.fullPath, () => { navOpen.value = false })
</script>

<template>
  <div class="min-h-screen bg-canvas lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    <a href="#main" class="absolute -top-15 left-4 z-30 rounded-md bg-marigold px-3.5 py-2.5 font-bold text-on-marigold focus:top-3">Skip to content</a>

    <aside class="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">
      <ProviderNav />
    </aside>

    <div class="flex min-w-0 flex-col">
      <header class="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur-sm">
        <div class="flex h-16 items-center gap-3 px-4 sm:px-8">
          <Sheet v-model:open="navOpen">
            <SheetTrigger as-child>
              <Button variant="outline" size="icon" class="border-[1.5px] border-line-strong lg:hidden" aria-label="Open menu"><Menu aria-hidden="true" /></Button>
            </SheetTrigger>
            <SheetContent side="left" hide-close class="w-[272px] border-line bg-surface p-0">
              <SheetTitle class="sr-only">Provider menu</SheetTitle>
              <SheetDescription class="sr-only">Provider dashboard sections</SheetDescription>
              <ProviderNav in-sheet />
            </SheetContent>
          </Sheet>

          <div class="flex min-w-0 flex-col">
            <span class="hidden truncate font-mono text-[10px] font-semibold tracking-[.12em] text-ink-muted uppercase sm:block">{{ membership?.name ?? 'Care provider' }}</span>
            <h1 class="m-0 truncate font-display text-xl leading-6 font-extrabold font-stretch-expanded">{{ title }}</h1>
          </div>

          <div class="ml-auto flex items-center gap-2.5">
            <Button v-if="route.path !== '/provider/listing'" as-child variant="outline" size="sm" class="hidden border-[1.5px] border-line-strong sm:inline-flex">
              <NuxtLink to="/provider/listing"><Pencil aria-hidden="true" />Edit your listing</NuxtLink>
            </Button>
            <ProviderMenu />
          </div>
        </div>
      </header>

      <main id="main" class="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 sm:px-8">
        <AccountBlockedBanner class="-mx-4 -mt-8 mb-6 sm:-mx-8" />
        <slot />
      </main>
    </div>
  </div>
</template>
