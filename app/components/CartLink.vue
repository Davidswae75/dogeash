<script setup lang="ts">
import { ShoppingCart } from '@lucide/vue'

// Header link to the gear cart. Stays out of the way until there's something in it.
const { count } = useCart()
</script>

<template>
  <ClientOnly>
    <NuxtLink
      v-if="count"
      to="/cart"
      class="relative grid size-[38px] place-items-center rounded-full border-[1.5px] border-line-strong text-ink no-underline hover:bg-surface-sunk [&.router-link-active]:border-ink"
      :aria-label="`Gear cart, ${count} ${count === 1 ? 'item' : 'items'}`"
    >
      <ShoppingCart class="size-[18px]" aria-hidden="true" />
      <span class="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1 text-[11px] font-bold text-on-marigold ring-2 ring-canvas" aria-hidden="true">{{ count }}</span>
    </NuxtLink>
  </ClientOnly>
</template>
