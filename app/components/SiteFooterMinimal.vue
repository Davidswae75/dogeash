<script setup lang="ts">
// Quiet footer for working pages: quick links only. The full footer stays on Home.
const year = new Date().getFullYear()

const links = [
  { label: 'Find a guard dog', to: '/dogs' },
  { label: 'Stores', to: '/stores' },
  { label: "Buyer's guide", to: '/guide' },
  { label: 'Sell with us', to: '/sell' },
]
</script>

<template>
  <footer class="mx-auto w-full max-w-[calc(var(--container)+64px)] px-4 pb-6 sm:px-8">
    <div class="flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Quick links" class="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-ink-muted no-underline hover:text-ink"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
      <p class="m-0 flex items-center gap-2 font-mono text-xs text-ink-muted">
        <span class="inline-block size-2 rounded-[2px] bg-marigold" aria-hidden="true" />
        © {{ year }} Dogeash
      </p>
    </div>
  </footer>
</template>
