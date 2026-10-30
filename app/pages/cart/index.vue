<script setup lang="ts">
import { ShoppingCart } from '@lucide/vue'

// The gear cart. Checkout needs an account, so delivery updates have somewhere to go.
useSeoMeta({ title: 'Your cart · Dogeash', robots: 'noindex' })

const { lines, count } = useCart()
const { guard } = useAccountGate({
  key: 'gear-checkout',
  action: 'check out',
  reason: 'Your order and delivery updates are kept in your account.',
}, () => navigateTo('/cart/checkout'))
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col gap-6 px-4 pt-8 sm:px-8 sm:pt-12">
    <h1 class="m-0 mega text-[clamp(34px,4vw,52px)] leading-none">Your <span class="text-outline">cart</span></h1>

    <ClientOnly>
      <div v-if="count" class="grid items-start gap-8 pb-8 lg:grid-cols-[1fr_340px]">
        <ul class="m-0 flex list-none flex-col divide-y divide-line rounded-xl bg-surface p-0 ring-1 ring-line">
          <GearCartLine v-for="line in lines" :key="line.key" :line="line" />
        </ul>
        <GearCartSummary class="lg:sticky lg:top-[calc(var(--header-height)+24px)]">
          <Button variant="marigold" class="w-full" @click="guard">Check out</Button>
          <NuxtLink to="/gear" class="text-center text-sm font-bold text-ink">Keep shopping</NuxtLink>
        </GearCartSummary>
      </div>

      <div v-else class="flex flex-col items-center gap-4 rounded-xl bg-surface px-6 py-14 text-center ring-1 ring-line">
        <span class="grid size-14 place-items-center rounded-full bg-marigold-soft"><ShoppingCart class="size-6" aria-hidden="true" /></span>
        <h2 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">Your cart is empty</h2>
        <p class="m-0 max-w-[30em] text-[15px] leading-6 text-ink-muted">The cart is for gear. Dogs go on your shortlist, because you meet them before you reserve.</p>
        <Button as-child><NuxtLink to="/gear">Browse gear</NuxtLink></Button>
      </div>

      <template #fallback>
        <div class="h-64 animate-pulse rounded-xl bg-surface-sunk" aria-hidden="true" />
      </template>
    </ClientOnly>
  </div>
</template>
