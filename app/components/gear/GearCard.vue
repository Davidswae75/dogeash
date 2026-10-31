<script setup lang="ts">
import { ShoppingCart } from '@lucide/vue'
import type { GearProduct } from '~/utils/gear'

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
    <GearIcon :category="props.product.category" :image="props.product.image" class="aspect-[16/8]" />
    <div class="flex flex-1 flex-col gap-3 p-5">
      <div class="flex flex-col gap-1">
        <span class="text-[11px] font-bold tracking-[.08em] text-ink-muted uppercase">{{ gearCategories[props.product.category] }}</span>
        <h3 class="m-0 font-display text-lg leading-6 font-extrabold font-stretch-expanded">{{ props.product.name }}</h3>
        <p class="m-0 text-sm leading-[21px] text-ink-muted">{{ props.product.description }}</p>
      </div>

      <div v-if="props.product.sizes" class="flex flex-col gap-1.5">
        <ToggleGroup v-model="size" type="single" variant="chip" :aria-label="`Size of ${props.product.name}`" class="flex w-auto justify-start gap-1.5">
          <ToggleGroupItem v-for="s in props.product.sizes" :key="s.value" :value="s.value" class="w-11 justify-center rounded-full! px-0">{{ s.value }}</ToggleGroupItem>
        </ToggleGroup>
        <span class="font-mono text-xs text-ink-muted">Fits dogs {{ fits }}</span>
      </div>

      <div class="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3.5">
        <span class="flex min-w-0 flex-col">
          <strong class="font-display text-xl leading-6 font-extrabold tabular-nums font-stretch-expanded">{{ formatNaira(props.product.priceNaira) }}</strong>
          <span v-if="supplier" class="truncate text-xs text-ink-muted">{{ supplier.name }}</span>
        </span>
        <Button size="sm" class="shrink-0" @click="addToCart"><ShoppingCart aria-hidden="true" />Add to cart</Button>
      </div>
    </div>
  </article>
</template>
