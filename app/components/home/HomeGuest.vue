<script setup lang="ts">
// Home for visitors who aren't signed in: a compact intro with the patrol chase, then dogs straight away.
// First-time visitors also get a one-time "New to guard dogs?" card.
const city = ref(marketCities[0]!)
const { dogs: recentlyViewed } = useRecentlyViewed()

const rows = [
  { title: 'Available', outline: 'now', subtitle: 'Trained adults ready for handover', seeAll: '/dogs', dogs: marketRows.availableNow() },
  { title: 'Family', outline: 'protection', subtitle: 'Level 4 dogs tested around children', seeAll: '/dogs?level=4', dogs: marketRows.familyProtection() },
  { title: 'For', outline: 'compounds', subtitle: 'Dogs that patrol and hold a perimeter', seeAll: '/dogs?property=compound', dogs: marketRows.forCompounds() },
]
const topStores = marketRows.topStores()
const cityDogs = computed(() => marketRows.inCity(city.value))

const section = homeSection
</script>

<template>
  <div class="flex flex-col gap-14 pb-10">
    <div :class="[section, 'flex flex-col gap-4 sm:gap-5']">
      <div class="h-3.5 rounded-full hazard" aria-hidden="true" />
      <HomeHero />
      <PromiseStrip />
      <HomeIntroCard />
    </div>

    <div :class="[section, 'flex flex-col gap-14']">
      <MarketRow v-for="row in rows" :key="row.seeAll" :title="row.title" :outline="row.outline" :subtitle="row.subtitle" :see-all="row.seeAll">
        <K9Card v-for="dog in row.dogs" :key="dog.fileNo" :dog="dog" class="w-[280px] sm:w-[300px]" />
      </MarketRow>

      <MarketRow title="Near" outline="you" subtitle="Dogs you can visit without a long drive" :see-all="`/dogs?city=${city}`">
        <template #actions>
          <ToggleGroup v-model="city" type="single" variant="chip" aria-label="City" class="hidden gap-1.5 lg:flex">
            <ToggleGroupItem v-for="c in marketCities.slice(0, 4)" :key="c" :value="c" class="rounded-full!">{{ c }}</ToggleGroupItem>
          </ToggleGroup>
        </template>
        <K9Card v-for="dog in cityDogs" :key="dog.fileNo" :dog="dog" class="w-[280px] sm:w-[300px]" />
      </MarketRow>

      <MarketRow title="Top-rated" outline="stores" subtitle="Kennels we have inspected, rated by buyers after handover" see-all="/stores">
        <StoreTile v-for="store in topStores" :key="store.id" :store="store" class="w-[340px] sm:w-[440px]" />
      </MarketRow>

      <ClientOnly>
        <MarketRow v-if="recentlyViewed.length" title="Recently" outline="viewed" subtitle="Pick up where you left off">
          <K9Card v-for="dog in recentlyViewed" :key="dog.fileNo" :dog="dog" class="w-[280px] sm:w-[300px]" />
        </MarketRow>
      </ClientOnly>
    </div>

    <section :class="[section, 'flex flex-col gap-6']">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h2 class="m-0 mega text-[clamp(24px,2.4vw,32px)] leading-none">Know what <span class="text-outline">a dog will do</span></h2>
        <p class="m-0 max-w-[24em] text-sm leading-[22px] text-ink-muted">Five protection levels, in plain words, checked at every kennel inspection.</p>
      </div>
      <ProtectionLevels />
    </section>

    <section :class="[section, 'flex flex-col gap-8']">
      <h2 class="m-0 mega text-[clamp(24px,2.4vw,32px)] leading-none">Search to <span class="text-outline">gate</span></h2>
      <HowItWorks />
    </section>
  </div>
</template>
