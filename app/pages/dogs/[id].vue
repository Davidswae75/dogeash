<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { createError, useRoute, useSeoMeta } from '#imports' // nuxt
import { useRecentlyViewed } from '~/composables/useRecentlyViewed'
import { useSession } from '~/composables/useSession'
import { dogeashId, findDog, getStore } from '~/utils/dogs'

// A dog's page: the store and whether it's available, photos, details, price and what you can do
const route = useRoute()
const dog = findDog(String(route.params.id))
if (!dog) throw createError({ statusCode: 404, statusMessage: 'No dog with that ID' })

const store = getStore(dog.storeId)
const file = dog.file
// People who work at this dog's store see management actions instead of Contact, Book and Save
const { memberOf } = useSession()
const isOwn = computed(() => !!memberOf(dog.storeId))

useSeoMeta({ title: `${dog.name}, ${dog.breed} · ${dogeashId(dog.fileNo)} · Dogeash` })

// Remembered for the "Recently viewed" row on Home
const { add: addRecentlyViewed } = useRecentlyViewed()
onMounted(() => addRecentlyViewed(dog.fileNo))

</script>

<template>
  <div v-if="dog" class="mx-auto flex max-w-page flex-col gap-6 px-4 pt-5 sm:px-8" :class="store && !isOwn ? 'pb-36 lg:pb-16' : 'pb-16'">
    <OwnListingBanner v-if="store" :store="store" what="listing" />
    <K9FileTab :label="store?.name ?? dog.city" :reserved="dog.status === 'reserved'" class="rounded-md px-[18px] py-3" />

    <!-- Gallery: main photo, then videos and more photos; any of them opens the full-screen viewer -->
    <DogGallery :dog="dog" />

    <div class="grid items-start gap-12 lg:grid-cols-[1fr_380px]">
      <div class="flex flex-col gap-6">
        <h1 class="m-0 font-display text-[clamp(36px,5vw,52px)] leading-none font-extrabold font-stretch-expanded">{{ dog.name }}</h1>
        <div class="max-w-[420px]"><ProtectionScale :level="dog.level" /></div>
        <p v-if="file" class="m-0 max-w-[38em] text-[17px] leading-7">{{ file.summary }}</p>

        <DogFacts :dog="dog" />

        <div v-if="file" class="grid items-center gap-5 rounded-lg bg-ash p-7 text-on-ash sm:rounded-xl md:grid-cols-2">
          <div>
            <span class="text-xs leading-4 font-bold tracking-[.08em] uppercase">Best suited to</span>
            <div class="mt-1 font-display text-2xl font-bold [font-stretch:110%]">{{ file.bestSuited }}</div>
            <p class="mt-1.5 mb-0 text-sm">{{ file.traits.join(' · ') }}</p>
          </div>
          <PatrolMap />
        </div>
      </div>

      <aside class="flex flex-col gap-3.5">
        <div class="flex flex-col gap-3.5 rounded-xl bg-night p-6 text-on-night">
          <span class="text-xs leading-4 font-bold tracking-[.08em] text-marigold uppercase">Price</span>
          <div class="font-display text-[40px] leading-none font-extrabold font-stretch-expanded">₦{{ dog.priceNaira.toLocaleString('en-NG') }}</div>
          <p class="m-0 text-sm leading-[21px]">Includes handover training at your gate and 30 days of trainer support.</p>
          <template v-if="store">
            <OwnListingActions v-if="isOwn" :store="store" :dog="dog" tone="night" />
            <!-- On phones these three live in the bar fixed to the bottom of the screen instead -->
            <div v-else class="hidden flex-col gap-3.5 lg:flex">
              <ReserveDialog :dog="dog" :store-name="store.name" trigger-class="h-11 w-full" />
              <ContactStoreDialog :store="store" :dog="dog" variant="outline" trigger-class="w-full border-on-night/40 bg-transparent text-on-night hover:bg-on-night/10" />
              <KennelVisitDialog :store="store" :dogs="[dog]" label="Book a visit" variant="night" trigger-class="h-10 w-full" />
            </div>
          </template>
        </div>
        <ShortlistButton v-if="!isOwn" :file-no="dog.fileNo" :name="dog.name" variant="button" />
        <StoreCard v-if="store" :store="store" compact />
        <ReportButton v-if="!isOwn" kind="dog" :target-id="dog.fileNo" what="this listing" class="self-start" />
      </aside>
    </div>

    <!-- Phone: reserve (with the deposit), contact and visit, always in reach at the bottom of the screen -->
    <div v-if="store && !isOwn" class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 gap-2 border-t border-line bg-canvas/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] backdrop-blur lg:hidden">
      <ReserveDialog :dog="dog" :store-name="store.name" trigger-class="col-span-2 h-11 w-full" />
      <ContactStoreDialog :store="store" :dog="dog" variant="outline" size="sm" trigger-class="h-10 w-full" />
      <KennelVisitDialog :store="store" :dogs="[dog]" label="Book a visit" variant="outline" trigger-class="h-10 w-full" />
    </div>
  </div>
</template>
