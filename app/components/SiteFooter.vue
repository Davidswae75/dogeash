<script setup lang="ts">
const year = new Date().getFullYear()

const links = [
  { label: 'Find a guard dog', to: '/dogs' },
  { label: 'Protection levels', to: '/protection-levels' },
  { label: 'Sell with us', to: '/sell' },
  { label: "Buyer's guide", to: '/guide' },
]
</script>

<template>
  <footer class="mx-auto mb-3 flex w-[calc(100%-24px)] max-w-page flex-col gap-8 rounded-lg bg-night px-6 py-7 text-on-night sm:mb-6 sm:w-[calc(100%-64px)] sm:rounded-xl sm:p-12">
    <div class="flex flex-wrap justify-between gap-x-12 gap-y-8">
      <div class="flex max-w-[24em] flex-col gap-2">
        <span class="font-display text-[26px] leading-none font-black tracking-[-.03em] text-marigold [font-stretch:120%]">dogeash</span>
        <p class="m-0 text-sm leading-[22px]">Trained guard dogs from kennels we inspect in person.</p>
      </div>
      <nav class="flex flex-wrap gap-x-7 gap-y-3 text-[15px] font-semibold" aria-label="Footer">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-on-night no-underline underline-offset-4 hover:underline"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
      <div class="flex flex-col gap-2">
        <span class="text-xs leading-4 font-bold tracking-[.08em] uppercase">Appearance</span>
        <ThemeToggle variant="segmented" />
      </div>
    </div>
    <p class="m-0 font-mono text-xs font-medium">© {{ year }} Dogeash</p>
  </footer>
</template>
