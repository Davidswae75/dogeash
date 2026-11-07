<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { definePageMeta, useRoute, useSeoMeta } from '#imports' // nuxt
import { useProviderDashboard } from '~/composables/useProviderDashboard'
import { careTypes } from '~/utils/care'
import { homeSection } from '~/utils/market'

// The provider dashboard, for someone who manages a care listing (a vet, a trainer…): its bookings and
// the listing itself, under one heading with tabs. Needs a listing to manage (Dogeash invites providers).
definePageMeta({ middleware: 'provider-member' })
useSeoMeta({ title: 'Provider dashboard · Dogeash', robots: 'noindex' })

const route = useRoute()
const dash = useProviderDashboard()
const { membership, requests } = dash
onMounted(dash.load)

const tabs = computed(() => [
  { to: '/provider', label: 'Bookings', count: requests.value.length },
  { to: '/provider/listing', label: 'Your listing', count: 0 },
])
</script>

<template>
  <div :class="[homeSection, 'flex flex-col gap-6 py-6 sm:py-8']">
    <header v-if="membership" class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-2">
        <span class="font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">Provider dashboard · {{ careTypes[membership.type].label }}</span>
        <h1 class="m-0 mega text-[clamp(28px,3vw,40px)] leading-none">{{ membership.name }}</h1>
      </div>
      <Button variant="outline" size="sm" as-child><NuxtLink :to="`/care/${membership.slug}`"><ExternalLink aria-hidden="true" />Your public page</NuxtLink></Button>
    </header>

    <nav aria-label="Provider dashboard" class="flex gap-1.5 border-b border-line">
      <NuxtLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        :aria-current="route.path === t.to ? 'page' : undefined"
        :class="['-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold no-underline', route.path === t.to ? 'border-marigold text-ink' : 'border-transparent text-ink-muted hover:text-ink']"
      >
        {{ t.label }}
        <span v-if="t.count" class="grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1.5 font-mono text-[10.5px] font-bold text-on-marigold">{{ t.count }}</span>
      </NuxtLink>
    </nav>

    <NuxtPage />
  </div>
</template>
