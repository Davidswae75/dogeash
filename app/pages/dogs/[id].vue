<script setup lang="ts">
// The full K9 file
const route = useRoute()
const dog = findDog(String(route.params.id))
if (!dog) throw createError({ statusCode: 404, statusMessage: 'No K9 file with that number' })

const store = getStore(dog.storeId)
const file = dog.file
// People who work at this dog's store see management actions instead of Contact, Book and Save
const { memberOf } = useSession()
const isOwn = computed(() => !!memberOf(dog.storeId))

useSeoMeta({ title: `${dog.name}, ${dog.breed} · ${dog.fileNo} · Dogeash` })

// Remembered for the "Recently viewed" row on Home
const { add: addRecentlyViewed } = useRecentlyViewed()
onMounted(() => addRecentlyViewed(dog.fileNo))

const facts = [
  { label: 'Age', value: file ? `${dog.age} · born ${file.born}` : dog.age },
  { label: 'Weight', value: `${dog.weightKg} kg` },
  { label: 'Hips / elbows', value: file?.hipsElbows ?? dog.hips },
  { label: 'Microchip', value: file?.microchip },
  { label: 'Vaccinations', value: file?.vaccinations },
  { label: 'Titles', value: file?.titles },
  { label: 'Sire', value: file?.sire },
  { label: 'Dam', value: file?.dam },
  { label: 'Kennel inspected', value: file?.inspected },
].filter(f => f.value)
</script>

<template>
  <div v-if="dog" class="mx-auto flex max-w-page flex-col gap-6 px-4 pt-5 pb-16 sm:px-8">
    <OwnListingBanner v-if="store" :store="store" what="listing" />
    <K9FileTab :file-no="dog.fileNo" :detail="dog.breed" :reserved="dog.status === 'reserved'" class="rounded-md px-[18px] py-3" />

    <!-- Gallery: main photo, two videos (obedience and protection), more photos -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-[210px_210px]">
      <div class="relative col-span-2 grid aspect-4/3 place-items-center rounded-lg bg-surface-sunk font-mono text-[13px] text-ink-muted md:col-span-1 md:row-span-2 md:aspect-auto">
        MAIN PHOTO
        <VerifiedStamp class="absolute right-[18px] bottom-[18px]" />
      </div>
      <div class="grid h-[140px] place-items-center rounded-lg bg-night font-mono text-[13px] text-on-night md:h-auto">▶ VIDEO · OBEDIENCE</div>
      <div class="grid h-[140px] place-items-center rounded-lg bg-night font-mono text-[13px] text-on-night md:h-auto">▶ VIDEO · PROTECTION</div>
      <div class="hidden place-items-center rounded-lg bg-surface-sunk font-mono text-[13px] text-ink-muted md:grid">PHOTO 2</div>
      <div class="hidden place-items-center rounded-lg bg-surface-sunk font-mono text-[13px] text-ink-muted md:grid">+ 8 MORE</div>
    </div>

    <div class="grid items-start gap-12 lg:grid-cols-[1fr_380px]">
      <div class="flex flex-col gap-6">
        <h1 class="m-0 font-display text-[clamp(36px,5vw,52px)] leading-none font-extrabold font-stretch-expanded">{{ dog.name }}</h1>
        <div class="max-w-[420px]"><ProtectionScale :level="dog.level" /></div>
        <p v-if="file" class="m-0 max-w-[38em] text-[17px] leading-7">{{ file.summary }}</p>

        <dl class="m-0 grid grid-cols-2 gap-x-6 gap-y-5 rounded-lg border border-line bg-surface p-6 sm:grid-cols-3">
          <div v-for="fact in facts" :key="fact.label">
            <dt class="text-xs leading-4 font-bold tracking-[.08em] text-ink-muted uppercase">{{ fact.label }}</dt>
            <dd class="m-0 font-mono text-[15px] leading-5 font-medium text-ink">{{ fact.value }}</dd>
          </div>
        </dl>

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
            <template v-else>
              <ContactStoreDialog :store="store" :dog="dog" trigger-class="w-full" />
              <KennelVisitDialog :store="store" :dogs="[dog]" label="Book a visit" variant="night" trigger-class="h-10 w-full" />
            </template>
          </template>
        </div>
        <ShortlistButton v-if="!isOwn" :file-no="dog.fileNo" :name="dog.name" variant="button" />
        <StoreCard v-if="store" :store="store" compact />
      </aside>
    </div>
  </div>
</template>
