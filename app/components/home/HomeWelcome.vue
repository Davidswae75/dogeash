<script setup lang="ts">
import { CalendarDays, Heart } from '@lucide/vue'
import guideNight from '~/assets/dogs/guide-night.jpg'

// Top of the signed-in Home: who you are, what's waiting, and search. Stays dark in both themes.
// A dog on night patrol fades into it: above the content on phones, beside it on wide screens.
const { user, firstName } = useSession()
const { count } = useShortlist()
const next = sampleBookings[0]
const query = ref('')

function search(q: string) {
  navigateTo({ path: '/dogs', query: q ? { q } : undefined })
}
</script>

<template>
  <section class="relative isolate flex overflow-hidden rounded-xl bg-night text-on-night">
    <div class="absolute inset-x-0 top-0 -z-10 h-64 overflow-hidden sm:h-80 lg:inset-y-0 lg:right-0 lg:left-auto lg:h-auto lg:w-[56%]">
      <img :src="guideNight" alt="A Malinois on night patrol along a floodlit compound wall" class="size-full animate-kenburns object-cover object-[40%_50%]">
      <div class="absolute inset-0 bg-linear-to-t from-night via-night/20 to-transparent lg:bg-linear-to-r lg:via-night/30" aria-hidden="true" />
    </div>
    <div class="flex w-full min-w-0 animate-rise flex-col gap-5 px-5 pt-52 pb-7 sm:px-9 sm:pt-64 sm:pb-10 lg:max-w-[64%] lg:py-14">
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
    </div>
  </section>
</template>
