<script setup lang="ts">
// Home for a signed-in buyer: no introductions, just their marketplace.
// Welcome and search, activity tiles, what's coming up and what changed, then dogs picked for them.
const { dogs: shortlist } = useShortlist()
const { dogs: recentlyViewed } = useRecentlyViewed()

const profile = sampleBuyerProfile
const propertyLabel = propertyTypes.find(p => p.value === profile.property)?.label.toLowerCase()
const matched = computed(() => marketRows.matchedTo(profile, shortlist.value.map(d => d.fileNo)))
const savedSearchDogs = marketRows.savedSearch(sampleSavedSearch)
const topStores = marketRows.topStores()

const section = homeSection
const card = 'w-[280px] sm:w-[300px]'
</script>

<template>
  <div class="flex flex-col gap-12 pb-10">
    <div :class="[section, 'flex flex-col gap-4 sm:gap-5']">
      <div class="h-2 rounded-full hazard" aria-hidden="true" />
      <HomeWelcome />
      <AccountGlance />
      <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 lg:grid-cols-2">
        <AccountComingUp />
        <AccountShortlistChanges />
      </div>
    </div>

    <div :class="[section, 'flex flex-col gap-14']">
      <ClientOnly>
        <MarketRow v-if="shortlist.length" title="Your" outline="shortlist" :subtitle="`${shortlist.length} saved · compare up to ${COMPARE_MAX}, then book one visit per store`" see-all="/shortlist">
          <K9Card v-for="dog in shortlist" :key="dog.fileNo" :dog="dog" :class="card" />
        </MarketRow>
      </ClientOnly>

      <MarketRow
        title="Matched to your"
        :outline="propertyLabel"
        :subtitle="`From your profile: ${propertyLabel} in ${profile.city}${profile.children ? ', children at home' : ''}. ${profile.city} dogs first.`"
        :see-all="`/dogs?property=${profile.property}`"
      >
        <ClientOnly>
          <K9Card v-for="dog in matched" :key="dog.fileNo" :dog="dog" :class="card" />
        </ClientOnly>
      </MarketRow>

      <MarketRow title="Saved search" :outline="sampleSavedSearch.label" :subtitle="`${savedSearchDogs.length} available now. We'll tell you when a new one is listed.`" :see-all="sampleSavedSearch.to">
        <K9Card v-for="dog in savedSearchDogs" :key="dog.fileNo" :dog="dog" :class="card" />
      </MarketRow>

      <ClientOnly>
        <MarketRow v-if="recentlyViewed.length" title="Recently" outline="viewed" subtitle="Pick up where you left off">
          <K9Card v-for="dog in recentlyViewed" :key="dog.fileNo" :dog="dog" :class="card" />
        </MarketRow>
      </ClientOnly>

      <MarketRow title="Top-rated" outline="stores" subtitle="Kennels we have inspected, rated by buyers after handover" see-all="/stores">
        <StoreTile v-for="store in topStores" :key="store.id" :store="store" class="w-[340px] sm:w-[440px]" />
      </MarketRow>
    </div>
  </div>
</template>
