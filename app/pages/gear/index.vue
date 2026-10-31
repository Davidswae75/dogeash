<script setup lang="ts">
import type { GearCategory } from '~/utils/gear'

// The gear shop: equipment from checked suppliers. Dogs are never sold through the cart.
useSeoMeta({
  title: 'Guard dog gear · Dogeash',
  description: 'Harnesses, collars, kennel runs, bowls, food and health care for guard dogs, from suppliers Dogeash has checked.',
})

const category = ref<GearCategory | ''>('')
const tabs = [['', 'All gear'], ...Object.entries(gearCategories)] as [GearCategory | '', string][]
const products = computed(() => sampleGear.filter(p => !category.value || p.category === category.value))
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col gap-6 px-4 pt-8 sm:px-8 sm:pt-12">
    <header class="flex animate-rise flex-col gap-3">
      <h1 class="m-0 mega text-[clamp(38px,4.6vw,64px)] leading-[.95]">Guard dog <span class="text-outline">gear</span></h1>
      <p class="m-0 max-w-[34em] text-[17px] leading-[27px] text-ink-muted">Everything your dog needs at home, from suppliers we have checked. Delivered to your gate.</p>
    </header>

    <nav v-center-tab aria-label="Category" class="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
      <button
        v-for="[value, label] in tabs"
        :key="value"
        type="button"
        :aria-pressed="category === value"
        :class="['-mb-px shrink-0 cursor-pointer border-0 border-b-[3px] bg-transparent px-3 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors', category === value ? 'border-marigold text-ink' : 'border-transparent text-ink-muted hover:text-ink']"
        @click="category = value"
      >{{ label }}</button>
    </nav>

    <div class="grid grid-cols-1 gap-6 pb-8 sm:grid-cols-2 lg:grid-cols-3">
      <GearCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </div>
</template>
