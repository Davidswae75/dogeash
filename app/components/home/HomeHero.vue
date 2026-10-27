<script setup lang="ts">
// Compact top of the marketplace: what Dogeash is in one line, search, quick property filters,
// and the patrol chase. Dogs start right below it.
const query = ref('')

function search(q: string) {
  navigateTo({ path: '/dogs', query: q ? { q } : undefined })
}
</script>

<template>
  <section class="grid items-center gap-8 rounded-xl bg-surface px-5 py-7 sm:px-9 sm:py-9 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
    <div class="flex min-w-0 animate-rise flex-col gap-5">
      <span class="text-xs leading-4 font-bold tracking-[.08em] uppercase">
        <span class="rounded-[4px] bg-marigold px-2.5 py-1.5 text-on-marigold">K9 · Verified kennels · Nigeria</span>
      </span>
      <h1 class="m-0 mega text-[clamp(32px,3.6vw,52px)] leading-[.98]">
        Trained guard dogs. <span class="rounded-lg bg-marigold px-[.1em] text-on-marigold box-decoration-clone">Checked</span>
        <span class="text-outline whitespace-nowrap">by us.</span>
      </h1>
      <SearchBar v-model="query" class="max-w-[560px]" @search="search" />
      <nav aria-label="Shop by property" class="flex flex-wrap items-center gap-2">
        <span class="mr-1 text-sm font-semibold text-ink-muted">Protecting a</span>
        <NuxtLink
          v-for="p in propertyTypes"
          :key="p.value"
          :to="{ path: '/dogs', query: { property: p.value } }"
          class="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line-strong px-3.5 py-1.5 text-sm font-semibold text-ink no-underline transition-colors hover:border-ink hover:bg-ink hover:text-canvas"
        >
          <AppIcon :name="p.value" :size="16" />{{ p.label }}
        </NuxtLink>
      </nav>
    </div>
    <div class="relative mx-auto w-full max-w-[480px] animate-rise [animation-delay:80ms]">
      <PatrolMap variant="night" />
      <KennelSticker class="absolute -top-8 -right-3 hidden sm:inline-grid" />
    </div>
  </section>
</template>
