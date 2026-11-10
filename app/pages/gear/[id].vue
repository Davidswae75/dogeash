<script setup lang="ts">
import { Check, Minus, Package, Plus, RotateCcw, ShieldCheck, ShoppingCart, Truck } from '@lucide/vue'
import { computed, ref } from 'vue'
import { createError, useRoute, useSeoMeta } from '#imports' // nuxt
import { useCart } from '~/composables/useCart'
import { useNotify } from '~/composables/useNotify'
import { careProviderSlug, findCareProvider } from '~/utils/care'
import { formatNaira } from '~/utils/dogs'
import { findGear, GEAR_DELIVERY_FEE, GEAR_FREE_DELIVERY_FROM, GEAR_MAX_QUANTITY, gearCategories, infoFor, sampleGear } from '~/utils/gear'

// One product: the photo, what it is and costs, the size (with who each fits) and how many, adding to the
// cart, then everything else a buyer needs before paying: what makes it good, the specifications, what's in
// the box, care, delivery and returns, and who supplies it. Similar products underneath.
const route = useRoute()
const found = findGear(String(route.params.id))
if (!found) throw createError({ statusCode: 404, statusMessage: 'No product with that code' })
const product = found
const info = infoFor(product)
const supplier = findCareProvider(product.supplierId)
const category = gearCategories[product.category]

useSeoMeta({
  title: `${product.name} · Gear · Dogeash`,
  description: `${product.description} ${formatNaira(product.priceNaira)}, delivered to your gate.`,
})

const size = ref(product.sizes?.[0]?.value ?? '')
const sizeModel = computed({ get: () => size.value, set: (v) => { if (v) size.value = v } })
const fits = computed(() => product.sizes?.find(s => s.value === size.value)?.fits)
const quantity = ref(1)
const total = computed(() => product.priceNaira * quantity.value)

const { add } = useCart()
const notify = useNotify()
const added = ref(false)
function addToCart() {
  add(product.id, size.value || undefined, quantity.value)
  notify.cartAdded(quantity.value > 1 ? `${quantity.value} × ${product.name}` : product.name, size.value || undefined)
  added.value = true
}

const similar = sampleGear.filter(p => p.id !== product.id && p.category === product.category)
  .concat(sampleGear.filter(p => p.id !== product.id && p.category !== product.category))
  .slice(0, 4)
const eyebrow = 'text-[11px] font-bold tracking-[.08em] text-ink-muted uppercase'
const h2 = 'm-0 font-display text-xl leading-7 font-extrabold font-stretch-expanded'
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col gap-10 px-4 pt-6 pb-28 sm:px-8 lg:pb-16">
    <nav aria-label="Breadcrumb" class="text-sm text-ink-muted">
      <NuxtLink to="/gear" class="text-ink-muted underline-offset-4 hover:underline">Gear</NuxtLink>
      <span aria-hidden="true"> / </span>
      <span>{{ category }}</span>
      <span aria-hidden="true"> / </span>
      <span class="text-ink">{{ product.name }}</span>
    </nav>

    <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
      <div class="overflow-hidden rounded-xl ring-1 ring-line lg:sticky lg:top-24">
        <GearIcon :category="product.category" :image="product.image" class="aspect-square" />
      </div>

      <!-- Choosing and buying -->
      <div class="flex flex-col gap-6">
        <header class="flex flex-col gap-2">
          <span :class="eyebrow">{{ category }} · <span class="font-mono">{{ product.id }}</span></span>
          <h1 class="m-0 mega text-[clamp(30px,3.6vw,46px)] leading-none">{{ product.name }}</h1>
          <p class="m-0 text-[16px] leading-[26px] text-ink-muted">{{ product.description }}</p>
          <strong class="mt-1 font-display text-3xl leading-none font-extrabold tabular-nums font-stretch-expanded">{{ formatNaira(product.priceNaira) }}</strong>
        </header>

        <fieldset v-if="product.sizes" class="m-0 flex flex-col gap-2 border-0 p-0">
          <legend class="mb-2 text-sm font-bold">Size <span class="font-normal text-ink-muted">· fits dogs {{ fits }}</span></legend>
          <ToggleGroup v-model="sizeModel" type="single" variant="chip" :aria-label="`Size of ${product.name}`" class="flex w-auto flex-wrap justify-start gap-2">
            <ToggleGroupItem v-for="s in product.sizes" :key="s.value" :value="s.value" class="h-auto min-w-16 flex-col gap-0 rounded-lg! px-3 py-2">
              <span class="text-sm font-bold">{{ s.value }}</span>
              <span class="font-mono text-[10.5px] opacity-70">{{ s.fits }}</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </fieldset>

        <div class="flex flex-col gap-2">
          <span class="text-sm font-bold">Quantity</span>
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex h-11 items-center rounded-full ring-1 ring-line-strong">
              <Button variant="ghost" size="icon" class="size-11 rounded-full" :disabled="quantity <= 1" aria-label="One fewer" @click="quantity--"><Minus aria-hidden="true" /></Button>
              <span class="w-8 text-center font-mono font-semibold tabular-nums" aria-live="polite">{{ quantity }}</span>
              <Button variant="ghost" size="icon" class="size-11 rounded-full" :disabled="quantity >= GEAR_MAX_QUANTITY" aria-label="One more" @click="quantity++"><Plus aria-hidden="true" /></Button>
            </div>
            <span v-if="quantity > 1" class="text-sm text-ink-muted">{{ formatNaira(total) }} in all</span>
          </div>
        </div>

        <div class="flex flex-col gap-2.5 sm:flex-row">
          <Button variant="marigold" class="h-12 flex-1 text-base" @click="addToCart"><ShoppingCart aria-hidden="true" />Add to cart · {{ formatNaira(total) }}</Button>
          <Button v-if="added" as-child variant="outline" class="h-12"><NuxtLink to="/cart">Go to cart</NuxtLink></Button>
        </div>

        <!-- Before paying: delivery, returns, who it's from -->
        <ul class="m-0 flex list-none flex-col divide-y divide-line rounded-xl bg-surface p-0 ring-1 ring-line">
          <li class="flex gap-3 p-4">
            <Truck class="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
            <span class="flex flex-col gap-0.5 text-sm leading-5">
              <strong>Delivered to your gate</strong>
              <span class="text-ink-muted">{{ formatNaira(GEAR_DELIVERY_FEE) }} delivery, free on orders from {{ formatNaira(GEAR_FREE_DELIVERY_FROM) }}. The rider calls before arriving.</span>
            </span>
          </li>
          <li class="flex gap-3 p-4">
            <RotateCcw class="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
            <span class="flex flex-col gap-0.5 text-sm leading-5">
              <strong>Wrong size? Swap it</strong>
              <span class="text-ink-muted">Unused gear can be swapped for another size within 7 days of delivery. Food and health products can't be returned once opened.</span>
            </span>
          </li>
          <li v-if="supplier" class="flex gap-3 p-4">
            <ShieldCheck class="mt-0.5 size-5 shrink-0 text-verified" aria-hidden="true" />
            <span class="flex flex-col gap-0.5 text-sm leading-5">
              <strong>Supplied by <NuxtLink :to="`/care/${careProviderSlug(supplier)}`" class="text-ink underline-offset-4 hover:underline">{{ supplier.name }}</NuxtLink></strong>
              <span class="text-ink-muted">{{ supplier.verified ? 'A supplier Dogeash has checked.' : 'A supplier on Dogeash.' }} {{ supplier.city }}.</span>
            </span>
          </li>
        </ul>
        <p class="m-0 font-mono text-xs text-ink-muted">Example product and prices. Payments aren't connected yet, so checkout is a preview.</p>
      </div>
    </div>

    <!-- Everything else about it -->
    <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <section v-if="info.features.length" class="flex flex-col gap-3 rounded-xl bg-surface p-5 ring-1 ring-line" aria-labelledby="features-title">
        <h2 id="features-title" :class="h2">Why it works</h2>
        <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
          <li v-for="f in info.features" :key="f" class="flex gap-2.5 text-[15px] leading-6"><Check class="mt-1 size-4 shrink-0 text-marigold-ink" :stroke-width="3" aria-hidden="true" />{{ f }}</li>
        </ul>
      </section>
      <section class="flex flex-col gap-3 rounded-xl bg-surface p-5 ring-1 ring-line" aria-labelledby="specs-title">
        <h2 id="specs-title" :class="h2">Specifications</h2>
        <dl class="m-0 flex flex-col divide-y divide-line">
          <div v-for="s in [{ label: 'Product code', value: product.id }, ...info.specs, ...(product.sizes ? [{ label: 'Sizes', value: product.sizes.map(z => `${z.value} (${z.fits})`).join(', ') }] : [])]" :key="s.label" class="flex justify-between gap-4 py-2.5 text-sm">
            <dt class="text-ink-muted">{{ s.label }}</dt>
            <dd class="m-0 text-right font-semibold">{{ s.value }}</dd>
          </div>
        </dl>
      </section>
      <section class="flex flex-col gap-3 rounded-xl bg-surface p-5 ring-1 ring-line" aria-labelledby="box-title">
        <h2 id="box-title" :class="h2">In the box</h2>
        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          <li v-for="b in info.inBox.length ? info.inBox : [product.name]" :key="b" class="flex gap-2.5 text-[15px] leading-6"><Package class="mt-1 size-4 shrink-0 text-ink-muted" aria-hidden="true" />{{ b }}</li>
        </ul>
        <p v-if="info.care" class="m-0 mt-auto rounded-lg bg-surface-sunk px-3.5 py-3 text-[13.5px] leading-5"><strong>Care:</strong> {{ info.care }}</p>
      </section>
    </div>

    <section v-if="similar.length" class="flex flex-col gap-4" aria-labelledby="similar-title">
      <h2 id="similar-title" class="m-0 mega text-[clamp(24px,2.6vw,32px)] leading-none">You may also need</h2>
      <div class="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <GearCard v-for="p in similar" :key="p.id" :product="p" />
      </div>
    </section>

    <!-- Phone: the price and Add to cart stay in reach -->
    <div class="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-canvas/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] backdrop-blur lg:hidden">
      <span class="flex min-w-0 flex-1 flex-col">
        <strong class="font-display text-lg leading-6 font-extrabold tabular-nums">{{ formatNaira(total) }}</strong>
        <span class="truncate text-xs text-ink-muted">{{ [size && `Size ${size}`, quantity > 1 && `${quantity} items`].filter(Boolean).join(' · ') || product.name }}</span>
      </span>
      <Button variant="marigold" class="h-11" @click="addToCart"><ShoppingCart aria-hidden="true" />Add to cart</Button>
    </div>
  </div>
</template>
