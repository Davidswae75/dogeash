<script setup lang="ts">
import { Star } from '@lucide/vue'
import type { CareProvider } from '~/utils/care'

// A provider in the directory: who they are, whether Dogeash has checked them, and a way to book
const props = defineProps<{ provider: CareProvider }>()
const path = computed(() => `/care/${careProviderSlug(props.provider)}`)
const storeCount = computed(() => storesForProvider(props.provider.id).length)
</script>

<template>
  <article class="flex animate-rise flex-col gap-4 rounded-lg bg-surface p-5 ring-1 ring-line">
    <div class="flex items-start gap-3.5">
      <CareProviderIcon :type="props.provider.type" />
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
