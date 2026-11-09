<script setup lang="ts">
import { CalendarClock, Check, MapPin, Star } from '@lucide/vue'
import { computed } from 'vue'
import { createError, useRoute, useSeoMeta } from '#imports' // nuxt
import { useSession } from '~/composables/useSession'
import { careTypes, findCareProviderBySlug, listedProviders, providerServices, scheduleLine, yearsActive } from '~/utils/care'
import { formatNaira } from '~/utils/dogs'
import { storesForProvider } from '~/utils/stores'

// One provider: who they are (photo, credential, years), about, their workplace in photos, history,
// services, the stores they work with, contact, and booking
const route = useRoute()
const provider = findCareProviderBySlug(String(route.params.slug))
if (!provider) throw createError({ statusCode: 404, statusMessage: 'No provider with that name' })
// Whoever manages this listing sees a note and a way to change it, and can't book it
const { providers } = useSession()
const managesIt = computed(() => providers.value.some(p => p.id === provider.id))

const typeLabel = careTypes[provider.type].label
useSeoMeta({
  title: `${provider.name}, ${typeLabel} in ${provider.city} · Dogeash`,
  description: `${provider.credential}. ${provider.areas}. Book an appointment on Dogeash.`,
})

const stores = storesForProvider(provider.id)
const years = yearsActive(provider)
const history = provider.history ?? []
const gallery = provider.gallery ?? []
const similar = listedProviders.value
  .filter(p => p.id !== provider.id && (p.type === provider.type || p.city === provider.city))
  .sort((a, b) => Number(b.type === provider.type) - Number(a.type === provider.type) || b.rating - a.rating)
  .slice(0, 2)

const facts = [
  { label: 'Areas covered', value: provider.areas },
  { label: 'Where', value: provider.homeVisits ? 'Home visits or at their premises' : 'At their premises' },
  { label: 'Price from', value: formatNaira(provider.priceFrom) },
  { label: 'When', value: scheduleLine(provider) },
  ...(provider.hours ? [{ label: 'Hours', value: provider.hours }] : []),
]
const eyebrow = 'text-xs leading-4 font-bold tracking-[.08em] uppercase'
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col gap-10 px-4 pt-6 sm:px-8">
    <nav aria-label="Breadcrumb" class="text-sm text-ink-muted">
      <NuxtLink to="/care" class="text-ink-muted underline-offset-4 hover:underline">Care</NuxtLink>
      <span aria-hidden="true"> / </span>
      <NuxtLink :to="`/care?type=${provider.type}`" class="text-ink-muted underline-offset-4 hover:underline">{{ typeLabel }}</NuxtLink>
      <span aria-hidden="true"> / </span>
      <span class="text-ink">{{ provider.name }}</span>
    </nav>

    <!-- Someone who manages this listing sees it as buyers do, with the way to change it -->
    <div v-if="managesIt" class="flex flex-wrap items-center gap-3 rounded-xl bg-night px-4 py-3 text-on-night">
      <span class="min-w-0 flex-1 text-sm"><strong>This is your listing.</strong> <span class="opacity-80">Buyers see it like this. You answer its bookings; you can't book it yourself.</span></span>
      <Button as-child variant="marigold" size="sm"><NuxtLink to="/provider/listing">Edit your listing</NuxtLink></Button>
      <Button as-child variant="outline" size="sm" class="border-on-night/30 bg-transparent text-on-night hover:bg-on-night/10"><NuxtLink to="/provider">Bookings</NuxtLink></Button>
    </div>

    <!-- Source order is details, booking, similar so booking comes before similar providers when stacked -->
    <div class="grid items-start gap-10 lg:grid-cols-[1fr_340px]">
      <div class="flex min-w-0 flex-col gap-10 lg:col-start-1">
        <header class="flex animate-rise flex-col gap-4">
          <img v-if="provider.photo" :src="provider.photo" :alt="provider.person || provider.name" class="size-24 rounded-full object-cover ring-2 ring-line">
          <CareProviderIcon v-else :type="provider.type" />
          <span :class="[eyebrow, 'text-marigold-ink']">{{ typeLabel }}</span>
          <h1 class="m-0 mega text-[clamp(34px,4vw,54px)] leading-none">{{ provider.name }}</h1>
          <p v-if="provider.person" class="m-0 text-[17px] leading-[27px] text-ink-muted">{{ provider.person }}</p>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span class="inline-flex items-center gap-1.5 font-semibold"><Star class="size-4 fill-marigold text-marigold" aria-hidden="true" />{{ provider.rating }} · {{ provider.reviews }} reviews</span>
            <span class="inline-flex items-center gap-1.5 text-ink-muted"><MapPin class="size-4" aria-hidden="true" />{{ provider.city }}</span>
            <span v-if="years" class="inline-flex items-center gap-1.5 text-ink-muted"><CalendarClock class="size-4" aria-hidden="true" />{{ years }} {{ years === 1 ? 'year' : 'years' }} with dogs</span>
          </div>
          <p class="m-0 flex items-start gap-2 text-[15px] leading-6 font-semibold" :class="provider.verified ? 'text-verified' : 'text-ink-muted'">
            <AppIcon v-if="provider.verified" name="shield" :size="20" class="shrink-0" />
            {{ provider.credential }}
          </p>
        </header>

        <section v-if="provider.about" class="flex flex-col gap-3" aria-labelledby="about-title">
          <h2 id="about-title" class="m-0 mega text-[clamp(26px,3vw,36px)] leading-none">About</h2>
          <p class="m-0 max-w-[44em] text-[16px] leading-[26px] whitespace-pre-line">{{ provider.about }}</p>
        </section>

        <!-- The workplace and their work, in photos -->
        <section v-if="gallery.length" class="flex flex-col gap-4" aria-labelledby="work-title">
          <h2 id="work-title" class="m-0 mega text-[clamp(26px,3vw,36px)] leading-none">Workplace</h2>
          <ul class="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:grid-cols-3">
            <li v-for="(src, i) in gallery" :key="src" :class="i === 0 && gallery.length > 2 ? 'col-span-2 row-span-2' : ''">
              <a :href="src" target="_blank" rel="noopener" class="block size-full overflow-hidden rounded-lg ring-1 ring-line">
                <img :src="src" :alt="`${provider.name}, photo ${i + 1}`" loading="lazy" class="aspect-4/3 size-full object-cover transition-transform duration-300 hover:scale-[1.03]">
              </a>
            </li>
          </ul>
        </section>

        <!-- History: when they started, then their milestones -->
        <section v-if="history.length || provider.startedYear" class="flex flex-col gap-4" aria-labelledby="history-title">
          <h2 id="history-title" class="m-0 mega text-[clamp(26px,3vw,36px)] leading-none">History</h2>
          <ol class="m-0 flex list-none flex-col p-0">
            <li v-if="provider.startedYear" class="relative flex gap-4 pb-5 pl-6 before:absolute before:top-2 before:bottom-0 before:left-[5px] before:w-px before:bg-line last:pb-0 last:before:hidden">
              <span class="absolute top-1.5 left-0 size-[11px] rounded-full bg-marigold" aria-hidden="true" />
              <span class="w-14 shrink-0 font-mono text-sm font-semibold">{{ provider.startedYear }}</span>
              <span class="text-[15px] leading-6">Started working with dogs</span>
            </li>
            <li v-for="(h, i) in history" :key="i" class="relative flex gap-4 pb-5 pl-6 before:absolute before:top-2 before:bottom-0 before:left-[5px] before:w-px before:bg-line last:pb-0 last:before:hidden">
              <span class="absolute top-1.5 left-0 size-[11px] rounded-full bg-surface ring-2 ring-ink" aria-hidden="true" />
              <span class="w-14 shrink-0 font-mono text-sm font-semibold">{{ h.year }}</span>
              <span class="text-[15px] leading-6">{{ h.text }}</span>
            </li>
          </ol>
        </section>

        <section class="flex flex-col gap-4" aria-labelledby="services-title">
          <h2 id="services-title" class="m-0 mega text-[clamp(26px,3vw,36px)] leading-none">Services</h2>
          <ul class="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2">
            <li v-for="service in providerServices(provider)" :key="service" class="flex items-center gap-3 rounded-lg bg-surface p-4 text-[15px] font-semibold ring-1 ring-line">
              <Check class="size-4 shrink-0 text-marigold-ink" :stroke-width="3" aria-hidden="true" />{{ service }}
            </li>
          </ul>
        </section>

        <section class="flex flex-col gap-4" aria-labelledby="stores-title">
          <h2 id="stores-title" class="m-0 mega text-[clamp(26px,3vw,36px)] leading-none">Stores they work with</h2>
          <ul v-if="stores.length" class="m-0 flex list-none flex-col divide-y divide-line rounded-lg bg-surface p-0 ring-1 ring-line">
            <li v-for="link in stores" :key="link.store.id" class="flex flex-wrap items-center justify-between gap-3 p-4">
              <span class="flex flex-col gap-0.5">
                <NuxtLink :to="`/stores/${link.store.slug}`" class="font-bold text-ink underline-offset-4 hover:underline">{{ link.store.name }}</NuxtLink>
                <span class="text-[13px] text-ink-muted">{{ link.store.city }}</span>
              </span>
              <span class="text-[13px] font-semibold">"{{ link.relationship }}"</span>
            </li>
          </ul>
          <p v-else class="m-0 rounded-lg bg-surface p-5 text-[15px] text-ink-muted ring-1 ring-line">No stores have linked to this provider yet.</p>
        </section>
      </div>

      <aside class="flex flex-col gap-4 rounded-xl bg-night p-6 text-on-night lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="Book">
        <span :class="[eyebrow, 'text-marigold']">Book an appointment</span>
        <dl class="m-0 flex flex-col gap-3">
          <div v-for="fact in facts" :key="fact.label">
            <dt class="text-[11px] leading-4 font-bold tracking-[.08em] uppercase opacity-80">{{ fact.label }}</dt>
            <dd class="m-0 text-[15px] leading-6 font-semibold">{{ fact.value }}</dd>
          </div>
        </dl>
        <CareBookingDialog :provider="provider" variant="marigold" trigger-class="w-full" />
        <p class="m-0 text-[13px] leading-5">You pay the provider directly for now.</p>
        <CareProviderContact :provider="provider" class="text-ink" />
      </aside>

      <section v-if="similar.length" class="flex min-w-0 flex-col gap-4 lg:col-start-1" aria-labelledby="similar-title">
        <h2 id="similar-title" class="m-0 mega text-[clamp(26px,3vw,36px)] leading-none">Also on Dogeash</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <CareProviderCard v-for="p in similar" :key="p.id" :provider="p" />
        </div>
      </section>
    </div>
  </div>
</template>
