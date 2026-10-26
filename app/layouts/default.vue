<script setup lang="ts">
// Pages opt into the full footer with definePageMeta({ footer: 'full' }); the rest get quick links only
const route = useRoute()
const fullFooter = computed(() => route.meta.footer === 'full')
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main"
      class="absolute -top-15 left-4 z-30 rounded-md bg-marigold px-3.5 py-2.5 font-bold text-on-marigold focus:top-3"
    >Skip to content</a>
    <SiteHeader />
    <main id="main" class="flex-1 pb-12">
      <slot />
    </main>
    <SiteFooter v-if="fullFooter" />
    <SiteFooterMinimal v-else />
  </div>
</template>
