<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

// Two or three shortlisted dogs side by side
useSeoMeta({ title: 'Compare dogs · Dogeash', robots: 'noindex' })

const { compareDogs, toggleCompare } = useShortlist()
const columns = computed(() => `minmax(140px,180px) repeat(${compareDogs.value.length}, minmax(220px,1fr))`)
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col gap-8 px-4 pt-6 pb-16 sm:px-8">
    <NuxtLink to="/shortlist" class="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink">
      <ArrowLeft class="size-4" aria-hidden="true" />Back to shortlist
    </NuxtLink>

    <ClientOnly>
      <template v-if="compareDogs.length >= 2">
        <h1 class="m-0 mega text-[clamp(30px,3.6vw,46px)] leading-none">Compare <span class="text-outline">{{ compareDogs.length }} dogs</span></h1>

        <div class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div role="table" aria-label="Dogs compared side by side" class="grid min-w-fit overflow-hidden rounded-xl bg-surface ring-1 ring-line" :style="{ gridTemplateColumns: columns }">
            <!-- Dogs -->
            <div role="row" class="contents">
              <div role="columnheader" class="sticky left-0 z-[1] bg-surface p-4" />
              <div v-for="dog in compareDogs" :key="dog.fileNo" role="columnheader" class="flex flex-col gap-3 border-l border-line p-4">
                <img :src="dog.photo" :alt="`${dog.name}, ${dog.breed}`" class="aspect-4/3 w-full rounded-md object-cover">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <NuxtLink :to="`/dogs/${dog.fileNo.toLowerCase()}`" class="font-display text-xl leading-6 font-extrabold text-ink no-underline font-stretch-expanded hover:underline">{{ dog.name }}</NuxtLink>
                    <span class="block font-mono text-xs text-ink-muted">{{ dog.fileNo }}</span>
                  </div>
                  <button type="button" class="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-ink-muted underline hover:text-ink" @click="toggleCompare(dog.fileNo)">Remove</button>
                </div>
                <ProtectionScale :level="dog.level" />
              </div>
            </div>

            <!-- Facts -->
            <div v-for="row in compareRows" :key="row.label" role="row" class="contents">
              <div role="rowheader" class="sticky left-0 z-[1] border-t border-line bg-surface px-4 py-3 text-xs font-bold tracking-[.06em] text-ink-muted uppercase">{{ row.label }}</div>
              <div
                v-for="dog in compareDogs"
                :key="dog.fileNo"
                role="cell"
                :class="['border-t border-l border-line px-4 py-3 text-[15px]', bestOn(row, compareDogs) === dog.fileNo && 'bg-marigold-soft font-bold']"
              >
                {{ row.value(dog) }}
                <span v-if="bestOn(row, compareDogs) === dog.fileNo" class="ml-1.5 rounded-full bg-marigold px-2 py-0.5 text-[10px] font-bold tracking-[.06em] text-on-marigold uppercase">Lowest</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="flex flex-col items-start gap-4 rounded-xl bg-surface p-8 ring-1 ring-line">
        <h1 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">Pick two or three dogs first</h1>
        <p class="m-0 text-[15px] text-ink-muted">Tick "Compare" on dogs in your shortlist, then come back here.</p>
        <Button as-child><NuxtLink to="/shortlist">Go to shortlist</NuxtLink></Button>
      </div>
    </ClientOnly>
  </div>
</template>
