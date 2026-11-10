<script setup lang="ts">
import type { GearProduct } from '~/utils/gear'
import { computed } from 'vue'
import { findCareProvider } from '~/utils/care'
import { formatNaira } from '~/utils/dogs'
import { gearCategories, gearPath } from '~/utils/gear'

// A product in the gear shop: just enough to choose (photo, kind, name, price, sizes on offer). The whole
// card opens the product's page, where the buyer picks a size and quantity and adds it to the cart.
const props = defineProps<{ product: GearProduct }>()
const supplier = computed(() => findCareProvider(props.product.supplierId))
</script>

<template>
  <NuxtLink :to="gearPath(props.product)" class="group flex flex-col overflow-hidden rounded-xl bg-surface text-ink no-underline ring-1 ring-line transition-shadow hover:ring-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none">
    <div class="overflow-hidden">
      <GearIcon :category="props.product.category" :image="props.product.image" class="aspect-[4/3] transition-transform duration-300 group-hover:scale-[1.03]" />
    </div>
    <div class="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
      <span class="text-[11px] font-bold tracking-[.08em] text-ink-muted uppercase">{{ gearCategories[props.product.category] }}</span>
      <h3 class="m-0 font-display text-[15px] leading-5 font-extrabold font-stretch-expanded sm:text-[17px] sm:leading-6">{{ props.product.name }}</h3>
      <div class="mt-auto flex items-end justify-between gap-2 pt-1.5">
        <strong class="font-display text-base leading-6 font-extrabold tabular-nums font-stretch-expanded sm:text-lg">{{ formatNaira(props.product.priceNaira) }}</strong>
        <span v-if="props.product.sizes" class="font-mono text-[11px] text-ink-muted">{{ props.product.sizes.map(s => s.value).join(' · ') }}</span>
      </div>
      <span v-if="supplier" class="truncate text-xs text-ink-muted">{{ supplier.name }}</span>
    </div>
  </NuxtLink>
</template>
