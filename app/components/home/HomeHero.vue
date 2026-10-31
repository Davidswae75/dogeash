<script setup lang="ts">
// Top of the marketplace: the promise, search, quick property filters and the patrol chase.
// Stays dark in both themes. Dogs start right below it.
const query = ref('')

function search(q: string) {
  navigateTo({ path: '/dogs', query: q ? { q } : undefined })
}
</script>

<template>
  <section class="grid items-center gap-8 rounded-xl bg-night px-5 py-7 text-on-night sm:px-9 sm:py-10 lg:grid-cols-[1.2fr_1fr] lg:gap-10 lg:py-12">
    <div class="flex min-w-0 animate-rise flex-col gap-5">
      <span class="text-xs leading-4 font-bold tracking-[.08em] uppercase">
        <span class="rounded-[4px] bg-marigold px-2.5 py-1.5 text-on-marigold">K9 · Verified kennels · Nigeria</span>
      </span>
      <h1 class="m-0 mega text-[clamp(26px,7.3vw,56px)] leading-[1.02] lg:text-[clamp(40px,3.9vw,48px)]">
        Trained Guardians<br>
        For The<br>
        <span class="text-marigold">Nigerian Home</span>
      </h1>
      <p class="m-0 max-w-[32em] text-base leading-[26px] text-on-night/80">
        Every kennel inspected in person. Every dog with a K9 file and handover training.
      </p>
      <SearchBar v-model="query" class="max-w-[560px] text-ink focus-within:outline-marigold!" @search="search" />
      <nav aria-label="Shop by property" class="flex flex-wrap items-center gap-2">
        <span class="mr-1 text-sm font-semibold text-on-night/80">Protecting a</span>
        <NuxtLink
          v-for="p in propertyTypes"
          :key="p.value"
          :to="{ path: '/dogs', query: { property: p.value } }"
          :class="homeHeroChip"
        >
          <AppIcon :name="p.value" :size="16" />{{ p.label }}
        </NuxtLink>
      </nav>
    </div>
    <div class="relative mx-auto w-full max-w-[480px] animate-rise [animation-delay:80ms]">
      <PatrolMap variant="night" />
      <KennelSticker class="absolute -top-6 -left-6 hidden sm:inline-grid" />
    </div>
  </section>
</template>
