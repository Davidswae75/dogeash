<script setup lang="ts">
import { Search } from '@lucide/vue'

useSeoMeta({
  title: 'Vets, trainers and dog care · Dogeash',
  description: 'Find and book vets, trainers, groomers, kennel builders and equipment suppliers for your guard dog in Nigeria.',
})

const { query, type, cities, options, sort, cityOptions, typeOptions, trustOptions, providers, clear } = useCareDirectory()
const eyebrow = 'text-xs leading-4 font-bold tracking-[.08em] uppercase'
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col gap-8 px-4 pt-8 sm:px-8 sm:pt-12">
    <header class="grid items-end gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div class="flex animate-rise flex-col gap-4">
        <span :class="[eyebrow, 'text-ink-muted']">{{ sampleCareProviders.length }} providers</span>
        <h1 class="m-0 mega text-[clamp(38px,4.6vw,64px)] leading-[.95]">Care for your <span class="text-outline">guard dog</span></h1>
        <p class="m-0 max-w-[30em] text-[17px] leading-[27px] text-ink-muted">Find a vet, trainer, groomer or kennel builder near you and book an appointment, whether or not you bought your dog here.</p>
      </div>
      <label for="care-search" class="flex animate-rise items-center gap-3 rounded-full border-2 border-ink bg-surface px-5 py-3 [animation-delay:80ms] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
        <Search class="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
        <span class="sr-only">Search care providers</span>
        <input id="care-search" v-model="query" type="search" placeholder="Service, name or area" class="min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-ink outline-none placeholder:text-ink-muted">
      </label>
    </header>

    <div class="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside class="flex min-w-0 flex-col gap-6" aria-label="Filters">
        <div class="flex flex-col gap-2.5">
          <span :class="[eyebrow, 'text-ink-muted']">Service</span>
          <div v-center-tab class="flex gap-2 overflow-x-auto [scrollbar-width:none] lg:flex-wrap lg:overflow-visible">
            <Button size="sm" :variant="type === '' ? 'default' : 'outline'" :aria-pressed="type === ''" class="shrink-0 rounded-full!" @click="type = ''">All</Button>
            <Button
              v-for="option in typeOptions"
              :key="option.value"
              size="sm"
              :variant="type === option.value ? 'default' : 'outline'"
              :aria-pressed="type === option.value"
              class="shrink-0 rounded-full!"
              @click="type = option.value"
            >{{ option.label }}</Button>
          </div>
        </div>
        <div class="flex flex-col gap-2.5">
          <span :class="[eyebrow, 'text-ink-muted']">City</span>
          <FilterChips v-center-tab v-model="cities" :options="cityOptions" label="City" class="flex-nowrap overflow-x-auto [scrollbar-width:none] lg:flex-wrap lg:overflow-visible" item-class="shrink-0" />
        </div>
        <div class="flex flex-col gap-2.5">
          <span :class="[eyebrow, 'text-ink-muted']">Show only</span>
          <FilterChips v-center-tab v-model="options" :options="trustOptions" label="Show only" class="flex-nowrap overflow-x-auto [scrollbar-width:none] lg:flex-wrap lg:overflow-visible" item-class="shrink-0" />
        </div>
      </aside>

      <div class="flex min-w-0 flex-col gap-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="text-sm font-semibold" aria-live="polite">{{ providers.length }} {{ providers.length === 1 ? 'provider' : 'providers' }}</span>
          <label class="flex items-center gap-2 text-sm">
            <span class="sr-only">Sort by</span>
            <NativeSelect v-model="sort" class="h-[38px] border-line-strong bg-surface font-semibold">
              <NativeSelectOption value="rating">Highest rated</NativeSelectOption>
              <NativeSelectOption value="reviews">Most reviewed</NativeSelectOption>
              <NativeSelectOption value="price">Lowest price</NativeSelectOption>
              <NativeSelectOption value="name">Name, A to Z</NativeSelectOption>
            </NativeSelect>
          </label>
        </div>
        <div v-if="providers.length" class="grid grid-cols-1 gap-4 md:grid-cols-2 rise-stagger">
          <CareProviderCard v-for="provider in providers" :key="provider.id" :provider="provider" />
        </div>
        <EmptyState v-else title="No providers match all of those" text="Try another city or service, or clear the filters." @clear="clear" />
      </div>
    </div>
  </div>
</template>
