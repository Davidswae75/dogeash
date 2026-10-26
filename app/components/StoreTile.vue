<script setup lang="ts">
import { Clock, MapPin, Star, Truck, UserRound } from '@lucide/vue'
import type { Store } from '~/utils/stores'

// A store in the directory: banner, who runs it, what it sells and why to trust it
const props = defineProps<{ store: Store }>()
const summary = computed(() => storeSummary(props.store))

const levelRange = computed(() => {
  const l = summary.value.levels
  if (!l.length) return '—'
  return l.length === 1 ? `Level ${l[0]}` : `${l[0]}–${l[l.length - 1]}`
})
const topLevel = computed(() => summary.value.levels.at(-1) ?? 0)
const thumbs = computed(() => summary.value.dogs.filter(d => d.photo).slice(0, 4))
const delivery = computed(() => props.store.services.includes('delivery')
  ? 'Delivers nationwide'
  : `Delivers in ${props.store.deliveryAreas.split(',').length} states`)
</script>

<template>
  <article class="group relative flex flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-line transition-[transform,box-shadow] duration-300 ease-calm hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgba(17,24,39,.55)] focus-within:ring-2 focus-within:ring-focus">
    <StoreBanner :store="props.store" class="aspect-[16/7] transition-[filter] duration-500 group-hover:brightness-105">
      <span class="absolute top-4 right-4 flex flex-col items-end gap-1.5">
        <span v-if="summary.available" class="rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink">{{ summary.available }} for sale</span>
      </span>
    </StoreBanner>

    <div class="flex flex-1 flex-col gap-5 p-6">
      <!-- Name and promise -->
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h3 class="m-0 font-display text-[26px] leading-[30px] font-extrabold font-stretch-expanded">
            <NuxtLink :to="`/stores/${props.store.slug}`" class="text-ink no-underline outline-none after:absolute after:inset-0 after:content-['']">
              {{ props.store.name }}
            </NuxtLink>
          </h3>
          <Badge v-if="props.store.verified" variant="verified">
            <AppIcon name="shield" :size="14" />Inspected {{ props.store.inspection.date }}
          </Badge>
          <Badge v-else>Inspection booked</Badge>
        </div>
        <p class="m-0 text-[15px] leading-6 font-medium text-ink">{{ props.store.tagline }}</p>
      </div>

      <!-- Who and where -->
      <ul class="m-0 grid list-none grid-cols-1 gap-x-5 gap-y-2 p-0 text-sm text-ink-muted sm:grid-cols-2">
        <li class="flex items-center gap-2"><MapPin class="size-4 shrink-0" aria-hidden="true" /><span class="truncate">{{ props.store.area }}, {{ props.store.city }}</span></li>
        <li class="flex items-center gap-2"><UserRound class="size-4 shrink-0" aria-hidden="true" /><span class="truncate">{{ props.store.owner.name }}</span></li>
        <li class="flex items-center gap-2"><Truck class="size-4 shrink-0" aria-hidden="true" />{{ delivery }}</li>
        <li class="flex items-center gap-2"><Clock class="size-4 shrink-0" aria-hidden="true" />Replies in {{ props.store.replies }}</li>
      </ul>

      <!-- The numbers buyers compare -->
      <dl class="m-0 grid grid-cols-2 overflow-hidden rounded-lg bg-canvas ring-1 ring-line sm:grid-cols-4">
        <div class="flex flex-col gap-1 p-3.5">
          <dt class="text-[10px] leading-3 font-bold tracking-[.08em] text-ink-muted uppercase">For sale</dt>
          <dd class="m-0 font-display text-[22px] leading-none font-extrabold tabular-nums font-stretch-expanded">{{ summary.available }}<span class="text-sm font-semibold text-ink-muted"> / {{ summary.dogs.length }}</span></dd>
        </div>
        <div class="flex flex-col gap-1 border-l border-line p-3.5">
          <dt class="text-[10px] leading-3 font-bold tracking-[.08em] text-ink-muted uppercase">From</dt>
          <dd class="m-0 font-display text-[22px] leading-none font-extrabold tabular-nums font-stretch-expanded">{{ summary.priceFrom ? formatNaira(summary.priceFrom) : '—' }}</dd>
        </div>
        <div class="flex flex-col gap-1.5 border-line p-3.5 max-sm:border-t sm:border-l">
          <dt class="text-[10px] leading-3 font-bold tracking-[.08em] text-ink-muted uppercase">Levels</dt>
          <dd class="m-0 flex flex-col gap-1.5">
            <span class="font-display text-[22px] leading-none font-extrabold font-stretch-expanded">{{ levelRange }}</span>
            <span class="flex gap-0.5" aria-hidden="true">
              <i v-for="n in 5" :key="n" :class="['h-1.5 flex-1 rounded-[1px]', n <= topLevel ? (n >= 4 ? 'bg-marigold' : 'bg-action') : 'bg-line']" />
            </span>
          </dd>
        </div>
        <div class="flex flex-col gap-1 border-l border-line p-3.5 max-sm:border-t">
          <dt class="text-[10px] leading-3 font-bold tracking-[.08em] text-ink-muted uppercase">Rating</dt>
          <dd class="m-0 flex items-baseline gap-1 font-display text-[22px] leading-none font-extrabold font-stretch-expanded">
            <template v-if="props.store.reviews">
              <Star class="size-4 self-center fill-marigold text-marigold" aria-hidden="true" />{{ props.store.rating }}
              <span class="font-sans text-xs font-semibold text-ink-muted">({{ props.store.reviews }})</span>
            </template>
            <span v-else class="text-base">New</span>
          </dd>
        </div>
      </dl>

      <!-- What they sell and do -->
      <div class="flex flex-col gap-2.5">
        <div v-if="summary.breeds.length" class="flex flex-wrap gap-1.5">
          <span v-for="breed in summary.breeds" :key="breed" class="rounded-full bg-ash-soft px-2.5 py-1 text-xs font-semibold text-ink">{{ breed }}</span>
        </div>
        <p class="m-0 text-[13px] leading-5 text-ink-muted">
          {{ props.store.services.map(s => storeServices[s].label).join(' · ') }}
        </p>
      </div>

      <!-- Footer: dogs and the way in -->
      <div class="mt-auto flex items-center justify-between gap-4 border-t border-line pt-4">
        <div v-if="thumbs.length" class="flex min-w-0 items-center gap-2.5">
          <span class="flex shrink-0 -space-x-2.5">
            <img
              v-for="dog in thumbs"
              :key="dog.fileNo"
              :src="dog.photo"
              :alt="`${dog.name}, ${dog.breed}`"
              loading="lazy"
              class="size-9 rounded-full border-2 border-surface object-cover"
            >
          </span>
          <span class="truncate text-[13px] text-ink-muted">{{ thumbs.map(d => d.name).join(', ') }}<template v-if="summary.dogs.length > thumbs.length"> +{{ summary.dogs.length - thumbs.length }}</template></span>
        </div>
        <span v-else class="text-[13px] text-ink-muted">Dogs listed after inspection</span>
        <span class="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink py-2 pr-2 pl-4 text-sm font-bold text-canvas transition-colors duration-300 group-hover:bg-marigold group-hover:text-on-marigold">
          Visit store
          <span class="grid size-6 place-items-center rounded-full bg-canvas/15 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
            <AppIcon name="arrow-right" :size="14" />
          </span>
        </span>
      </div>
    </div>
  </article>
</template>
