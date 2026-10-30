<script setup lang="ts">
// Subtotal, delivery and total, on the cart and at checkout. The action goes in the slot.
const { subtotal, delivery, total } = useCart()
const toFree = computed(() => GEAR_FREE_DELIVERY_FROM - subtotal.value)
</script>

<template>
  <div class="flex flex-col gap-4 rounded-xl bg-surface p-6 ring-1 ring-line">
    <h2 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Summary</h2>
    <dl class="m-0 flex flex-col gap-2 text-sm">
      <div class="flex justify-between"><dt class="text-ink-muted">Subtotal</dt><dd class="m-0 font-mono tabular-nums">{{ formatNaira(subtotal) }}</dd></div>
      <div class="flex justify-between"><dt class="text-ink-muted">Delivery</dt><dd class="m-0 font-mono tabular-nums">{{ delivery ? formatNaira(delivery) : 'Free' }}</dd></div>
      <div class="flex items-baseline justify-between border-t border-line pt-3"><dt class="font-bold">Total</dt><dd class="m-0 font-display text-2xl font-extrabold tabular-nums font-stretch-expanded">{{ formatNaira(total) }}</dd></div>
    </dl>
    <p v-if="toFree > 0" class="m-0 text-[13px] text-ink-muted">Add {{ formatNaira(toFree) }} more for free delivery.</p>
    <slot />
    <p class="m-0 font-mono text-xs text-ink-muted">Example prices and delivery fees.</p>
  </div>
</template>
