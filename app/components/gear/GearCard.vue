<script setup lang="ts">
import type { GearProduct } from '~/utils/gear'
import { computed } from 'vue'
import { findCareProvider } from '~/utils/care'
import { formatNaira } from '~/utils/dogs'
import { gearCategories, gearPath } from '~/utils/gear'

// A product in the gear shop: just enough to choose (photo, kind, name, price, how many sizes, supplier). The whole
// card opens the product's page, where the buyer picks a size and quantity and adds it to the cart.
const props = defineProps<{ product: GearProduct }>()
const supplier = computed(() => findCareProvider(props.product.supplierId))
</script>

<template>
  <NuxtLink :to="gearPath(props.product)" class="group flex flex-col overflow-hidden rounded-xl bg-surface text-ink no-underline ring-1 ring-line transition-shadow hover:ring-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none">
    <div class="overflow-hidden">
      <GearIcon :category="props.product.category" :image="props.product.image" class="aspect-[4/3] transition-transform duration-300 group-hover:scale-[1.03]" />
    </div>
    <!-- Small, even text: the kind on one line, the name on up to two, then the price; sizes and supplier quiet -->
    <div class="flex flex-1 flex-col gap-1 p-3 sm:p-4">
      <span class="truncate text-[10px] font-bold tracking-[.08em] text-ink-muted uppercase sm:text-[11px]">{{ gearCategories[props.product.category] }}</span>
      <h3 class="m-0 line-clamp-2 min-h-[2lh] font-display text-sm leading-[18px] font-extrabold font-stretch-expanded sm:text-base sm:leading-5">{{ props.product.name }}</h3>
      <strong class="mt-auto pt-1.5 font-display text-[15px] leading-5 font-extrabold tabular-nums font-stretch-expanded sm:text-lg sm:leading-6">{{ formatNaira(props.product.priceNaira) }}</strong>
      <span class="truncate text-[11px] leading-4 text-ink-muted sm:text-xs">{{ [props.product.sizes ? `${props.product.sizes.length} sizes` : '', supplier?.name].filter(Boolean).join(' · ') }}</span>
    </div>
  </NuxtLink>
</template>
