<script setup lang="ts">
// Top of the marketplace: the patrol chase, the promise, search and quick property filters.
// Dogs start right below it.
const query = ref('')

function search(q: string) {
  navigateTo({ path: '/dogs', query: q ? { q } : undefined })
}
</script>

<template>
  <HomeHeroFrame>
    <template #media>
      <PatrolMap variant="night" cover />
    </template>
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
    <template #corner>
      <KennelSticker class="absolute top-5 left-[52%] hidden lg:inline-grid" />
    </template>
  </HomeHeroFrame>
</template>
