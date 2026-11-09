<script setup lang="ts">
import { CalendarClock, Star } from '@lucide/vue'
import type { CareProvider } from '~/utils/care'
import { computed } from 'vue'
import { careProviderSlug, careTypes, providerServices, scheduleLine } from '~/utils/care'
import { formatNaira } from '~/utils/dogs'
import { storesForProvider } from '~/utils/stores'

// A provider in the directory: who they are, whether Dogeash has checked them, what they offer and when,
// and a way to book
const props = defineProps<{ provider: CareProvider }>()
const services = computed(() => providerServices(props.provider))
const path = computed(() => `/care/${careProviderSlug(props.provider)}`)
const storeCount = computed(() => storesForProvider(props.provider.id).length)
</script>

<template>
  <article class="flex animate-rise flex-col gap-4 rounded-lg bg-surface p-5 ring-1 ring-line">
    <div class="flex items-start gap-3.5">
      <img v-if="props.provider.photo" :src="props.provider.photo" :alt="props.provider.person || props.provider.name" loading="lazy" class="size-12 shrink-0 rounded-full object-cover ring-1 ring-line">
      <CareProviderIcon v-else :type="props.provider.type" />
      <div class="flex min-w-0 flex-col gap-0.5">
        <span class="text-[11px] leading-4 font-bold tracking-[.08em] text-marigold-ink uppercase">{{ careTypes[props.provider.type].label }} · {{ props.provider.city }}</span>
        <NuxtLink :to="path" class="font-display text-[19px] leading-6 font-extrabold text-ink font-stretch-expanded underline-offset-4 hover:underline">{{ props.provider.name }}</NuxtLink>
        <span v-if="props.provider.person" class="text-[13px] leading-5 text-ink-muted">{{ props.provider.person }}</span>
      </div>
    </div>

    <p class="m-0 flex items-start gap-2 text-[13px] leading-5" :class="props.provider.verified ? 'text-verified' : 'text-ink-muted'">
      <AppIcon v-if="props.provider.verified" name="shield" :size="16" class="shrink-0" />
      <span>{{ props.provider.credential }}</span>
    </p>

    <dl class="m-0 grid grid-cols-2 gap-3 border-y border-line py-3 text-sm">
      <div>
        <dt class="text-[10px] leading-3 font-bold tracking-[.08em] text-ink-muted uppercase">Rating</dt>
        <dd class="m-0 mt-1 inline-flex items-center gap-1 font-mono font-semibold"><Star class="size-3.5 fill-marigold text-marigold" aria-hidden="true" />{{ props.provider.rating }} · {{ props.provider.reviews }}</dd>
      </div>
      <div>
        <dt class="text-[10px] leading-3 font-bold tracking-[.08em] text-ink-muted uppercase">From</dt>
        <dd class="m-0 mt-1 font-mono font-semibold">{{ formatNaira(props.provider.priceFrom) }}</dd>
      </div>
    </dl>

    <!-- What they offer, and when they take bookings -->
    <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Services">
      <li v-for="s in services.slice(0, 4)" :key="s" class="rounded-full bg-surface-sunk px-2.5 py-1 text-xs font-semibold">{{ s }}</li>
      <li v-if="services.length > 4" class="rounded-full px-1.5 py-1 text-xs font-semibold text-ink-muted">+{{ services.length - 4 }} more</li>
    </ul>
    <p class="m-0 flex items-center gap-1.5 text-[13px] leading-5"><CalendarClock class="size-4 shrink-0 text-ink-muted" aria-hidden="true" />{{ scheduleLine(props.provider) }}<span v-if="props.provider.takingBookings === false" class="text-ink-muted"> · not taking bookings now</span></p>

    <p class="m-0 text-[13px] leading-5 text-ink-muted">
      {{ props.provider.areas }}
      <template v-if="props.provider.homeVisits"> · Home visits</template>
      <template v-if="storeCount"> · Works with {{ storeCount }} {{ storeCount === 1 ? 'store' : 'stores' }}</template>
    </p>

    <div class="mt-auto flex flex-wrap gap-2">
      <CareBookingDialog :provider="props.provider" label="Book" />
      <Button as-child variant="outline" size="sm"><NuxtLink :to="path">View details</NuxtLink></Button>
    </div>
  </article>
</template>
