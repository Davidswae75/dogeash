<script setup lang="ts">
import { ShoppingCart } from '@lucide/vue'
import type { GearProduct } from '~/utils/gear'
import { computed, ref } from 'vue'
import { useCart } from '~/composables/useCart'
import { useNotify } from '~/composables/useNotify'
import { findCareProvider } from '~/utils/care'
import { formatNaira } from '~/utils/dogs'
import { gearCategories } from '~/utils/gear'

// A product in the gear shop: pick a size if it has sizes, then add to the cart
const props = defineProps<{ product: GearProduct }>()

const { add } = useCart()
const notify = useNotify()
const size = ref(props.product.sizes?.[0]?.value)
const fits = computed(() => props.product.sizes?.find(s => s.value === size.value)?.fits)
const supplier = computed(() => findCareProvider(props.product.supplierId))

function addToCart() {
  add(props.product.id, size.value)
  notify.cartAdded(props.product.name, size.value)
}
</script>

<template>
  <article class="flex flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-line">
    <GearIcon :category="props.product.category" :image="props.product.image" class="aspect-[4/3] sm:aspect-[16/8]" />
    <div class="flex flex-1 flex-col gap-3 p-3 sm:p-5">
      <div class="flex flex-col gap-1">
        <span class="text-[11px] font-bold tracking-[.08em] text-ink-muted uppercase">{{ gearCategories[props.product.category] }}</span>
        <h3 class="m-0 font-display text-[15px] leading-5 font-extrabold font-stretch-expanded sm:text-lg sm:leading-6">{{ props.product.name }}</h3>
        <p class="m-0 line-clamp-2 text-[13px] leading-[19px] text-ink-muted sm:line-clamp-none sm:text-sm sm:leading-[21px]">{{ props.product.description }}</p>
      </div>

      <div v-if="props.product.sizes" class="flex flex-col gap-1.5">
        <ToggleGroup v-model="size" type="single" variant="chip" :aria-label="`Size of ${props.product.name}`" class="flex w-auto flex-wrap justify-start gap-1.5">
          <ToggleGroupItem v-for="s in props.product.sizes" :key="s.value" :value="s.value" class="w-10 justify-center rounded-full! px-0 sm:w-11">{{ s.value }}</ToggleGroupItem>
        </ToggleGroup>
        <span class="font-mono text-xs text-ink-muted">Fits dogs {{ fits }}</span>
      </div>

      <div class="mt-auto flex flex-col gap-3 border-t border-line pt-3.5 sm:flex-row sm:items-center sm:justify-between">
        <span class="flex min-w-0 flex-col">
          <strong class="font-display text-base leading-6 font-extrabold tabular-nums font-stretch-expanded sm:text-xl">{{ formatNaira(props.product.priceNaira) }}</strong>
          <span v-if="supplier" class="truncate text-xs text-ink-muted">{{ supplier.name }}</span>
        </span>
        <Button size="sm" class="w-full shrink-0 sm:w-auto" @click="addToCart"><ShoppingCart aria-hidden="true" />Add to cart</Button>
      </div>
    </div>
  </article>
</template>
