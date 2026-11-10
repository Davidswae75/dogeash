<script setup lang="ts">
import type { CareProvider } from '~/utils/care'
import { computed } from 'vue'
import { careProviderSlug, careTypes, providerServices, scheduleLine } from '~/utils/care'

// A provider in a compact list (a dog's care team, choosing whom to book or add): photo or icon, name, kind
// and city, what they offer and when. Actions go in the default slot, on the right (below on phones).
const props = defineProps<{ provider: CareProvider, note?: string }>()
const services = computed(() => providerServices(props.provider))
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-start">
    <div class="flex min-w-0 flex-1 gap-3">
      <img v-if="props.provider.photo" :src="props.provider.photo" alt="" class="size-10 shrink-0 rounded-full object-cover ring-1 ring-line">
      <CareProviderIcon v-else :type="props.provider.type" class="size-10! shrink-0" />
      <div class="flex min-w-0 flex-col gap-1">
        <span class="flex flex-wrap items-baseline gap-x-2">
          <NuxtLink :to="`/care/${careProviderSlug(props.provider)}`" target="_blank" class="font-bold text-ink underline-offset-4 hover:underline">{{ props.provider.name }}</NuxtLink>
          <span class="text-xs text-ink-muted">{{ careTypes[props.provider.type].label }} · {{ props.provider.city }}</span>
        </span>
        <span v-if="props.note" class="text-xs font-semibold text-marigold-ink">{{ props.note }}</span>
        <ul class="m-0 flex list-none flex-wrap gap-1 p-0" aria-label="Services">
          <li v-for="s in services.slice(0, 4)" :key="s" class="rounded-full bg-surface-sunk px-2 py-0.5 text-[11px] font-semibold">{{ s }}</li>
          <li v-if="services.length > 4" class="px-1 py-0.5 text-[11px] font-semibold text-ink-muted">+{{ services.length - 4 }} more</li>
        </ul>
        <span class="text-xs text-ink-muted">{{ scheduleLine(props.provider) }}<template v-if="props.provider.takingBookings === false"> · not taking bookings now</template></span>
      </div>
    </div>
    <div class="flex shrink-0 flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
      <slot />
    </div>
  </div>
</template>
