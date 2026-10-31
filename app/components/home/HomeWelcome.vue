<script setup lang="ts">
import { CalendarDays, Heart } from '@lucide/vue'
import guideNight from '~/assets/dogs/guide-night.jpg'

// Top of the signed-in Home: who you are, what's waiting, and search, with a dog on night patrol.
const { user, firstName } = useSession()
const { count } = useShortlist()
const next = sampleBookings[0]
const query = ref('')

function search(q: string) {
  navigateTo({ path: '/dogs', query: q ? { q } : undefined })
}
</script>

<template>
  <HomeHeroFrame>
    <template #media>
      <img :src="guideNight" alt="A Malinois on night patrol along a floodlit compound wall" class="size-full animate-kenburns object-cover object-[40%_50%]">
    </template>
    <span class="font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-marigold uppercase">
      My Dogeash · {{ user?.city }} · {{ user?.id }}
    </span>
    <h1 class="m-0 mega text-[clamp(32px,4vw,52px)] leading-[1.02]">
      Welcome back, <span class="text-marigold">{{ firstName }}.</span>
    </h1>
    <div class="flex flex-wrap gap-2">
      <NuxtLink to="/shortlist" :class="homeHeroChip">
        <Heart class="size-4" aria-hidden="true" />
        <ClientOnly>
          {{ count }} {{ count === 1 ? 'dog' : 'dogs' }} on your shortlist
          <template #fallback>Your shortlist</template>
        </ClientOnly>
      </NuxtLink>
      <NuxtLink v-if="next" :to="next.to" :class="homeHeroChip">
        <CalendarDays class="size-4" aria-hidden="true" />Next visit {{ next.day }}, {{ next.time }}
      </NuxtLink>
    </div>
    <SearchBar v-model="query" class="max-w-[560px] text-ink focus-within:outline-marigold!" @search="search" />
  </HomeHeroFrame>
</template>
