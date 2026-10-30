<script setup lang="ts">
import { Check, MapPin, Star } from '@lucide/vue'

// One provider: credentials, services, the stores they work with, and booking
const route = useRoute()
const provider = findCareProviderBySlug(String(route.params.slug))
if (!provider) throw createError({ statusCode: 404, statusMessage: 'No provider with that name' })

const typeLabel = careTypes[provider.type].label
useSeoMeta({
  title: `${provider.name}, ${typeLabel} in ${provider.city} · Dogeash`,
  description: `${provider.credential}. ${provider.areas}. Book an appointment on Dogeash.`,
})

const stores = storesForProvider(provider.id)
const similar = sampleCareProviders
  .filter(p => p.id !== provider.id && (p.type === provider.type || p.city === provider.city))
  .sort((a, b) => Number(b.type === provider.type) - Number(a.type === provider.type) || b.rating - a.rating)
  .slice(0, 2)

const facts = [
  { label: 'Areas covered', value: provider.areas },
  { label: 'Where', value: provider.homeVisits ? 'Home visits or at their premises' : 'At their premises' },
  { label: 'Price from', value: formatNaira(provider.priceFrom) },
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

    <div class="grid items-start gap-10 lg:grid-cols-[1fr_340px]">
      <div class="flex min-w-0 flex-col gap-10">
        <header class="flex animate-rise flex-col gap-4">
          <CareProviderIcon :type="provider.type" />
          <span :class="[eyebrow, 'text-marigold-ink']">{{ typeLabel }}</span>
          <h1 class="m-0 mega text-[clamp(34px,4vw,54px)] leading-none">{{ provider.name }}</h1>
          <p v-if="provider.person" class="m-0 text-[17px] leading-[27px] text-ink-muted">{{ provider.person }}</p>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span class="inline-flex items-center gap-1.5 font-semibold"><Star class="size-4 fill-marigold text-marigold" aria-hidden="true" />{{ provider.rating }} · {{ provider.reviews }} reviews</span>
            <span class="inline-flex items-center gap-1.5 text-ink-muted"><MapPin class="size-4" aria-hidden="true" />{{ provider.city }}</span>
          </div>
          <p class="m-0 flex items-start gap-2 text-[15px] leading-6 font-semibold" :class="provider.verified ? 'text-verified' : 'text-ink-muted'">
            <AppIcon v-if="provider.verified" name="shield" :size="20" class="shrink-0" />
            {{ provider.credential }}
          </p>
        </header>

        <section class="flex flex-col gap-4" aria-labelledby="services-title">
          <h2 id="services-title" class="m-0 mega text-[clamp(26px,3vw,36px)] leading-none">Services</h2>
          <ul class="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2">
            <li v-for="service in careTypes[provider.type].services" :key="service" class="flex items-center gap-3 rounded-lg bg-surface p-4 text-[15px] font-semibold ring-1 ring-line">
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

        <section v-if="similar.length" class="flex flex-col gap-4" aria-labelledby="similar-title">
          <h2 id="similar-title" class="m-0 mega text-[clamp(26px,3vw,36px)] leading-none">Also on Dogeash</h2>
          <div class="grid gap-4 md:grid-cols-2">
            <CareProviderCard v-for="p in similar" :key="p.id" :provider="p" />
          </div>
        </section>
      </div>

      <aside class="flex flex-col gap-4 rounded-xl bg-night p-6 text-on-night lg:sticky lg:top-24" aria-label="Book">
        <span :class="[eyebrow, 'text-marigold']">Book an appointment</span>
        <dl class="m-0 flex flex-col gap-3">
          <div v-for="fact in facts" :key="fact.label">
            <dt class="text-[11px] leading-4 font-bold tracking-[.08em] uppercase opacity-80">{{ fact.label }}</dt>
            <dd class="m-0 text-[15px] leading-6 font-semibold">{{ fact.value }}</dd>
          </div>
        </dl>
        <CareBookingDialog :provider="provider" variant="marigold" trigger-class="w-full" />
        <p class="m-0 text-[13px] leading-5">You pay the provider directly for now.</p>
      </aside>
    </div>
  </div>
</template>
