<script setup lang="ts">
import { Minus, Plus, Trash2 } from '@lucide/vue'
import type { GearProduct } from '~/utils/gear'

// One line in the cart: what it is, how many, and the line total
const props = defineProps<{ line: { key: string, product: GearProduct, size?: string, quantity: number, total: number } }>()
const { setQuantity, remove } = useCart()
const notify = useNotify()

function removeLine() {
  notify.cartRemoved(props.line.product.name, remove(props.line.key))
}

const stepper = 'grid size-9 cursor-pointer place-items-center border-0 bg-transparent text-ink hover:bg-surface-sunk disabled:cursor-not-allowed disabled:opacity-40'
</script>

<template>
  <li class="flex gap-4 p-4 sm:p-5">
    <GearIcon :category="props.line.product.category" class="size-16 shrink-0 rounded-md sm:size-20" />
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <span class="min-w-0">
          <strong class="block text-[15px] leading-[22px]">{{ props.line.product.name }}</strong>
          <span class="text-[13px] text-ink-muted"><template v-if="props.line.size">Size {{ props.line.size }} · </template>{{ formatNaira(props.line.product.priceNaira) }} each</span>
        </span>
        <strong class="shrink-0 font-mono text-[15px] tabular-nums">{{ formatNaira(props.line.total) }}</strong>
      </div>
      <div class="flex items-center justify-between gap-3">
        <div class="inline-flex items-center overflow-hidden rounded-full ring-[1.5px] ring-line-strong" role="group" :aria-label="`Quantity of ${props.line.product.name}`">
          <button type="button" :class="stepper" :disabled="props.line.quantity <= 1" aria-label="One fewer" @click="setQuantity(props.line.key, props.line.quantity - 1)"><Minus class="size-4" aria-hidden="true" /></button>
          <span class="w-8 text-center font-mono text-sm font-semibold tabular-nums" aria-live="polite">{{ props.line.quantity }}</span>
          <button type="button" :class="stepper" :disabled="props.line.quantity >= GEAR_MAX_QUANTITY" aria-label="One more" @click="setQuantity(props.line.key, props.line.quantity + 1)"><Plus class="size-4" aria-hidden="true" /></button>
        </div>
        <button type="button" class="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-1 text-sm font-semibold text-ink-muted hover:text-ink" @click="removeLine">
          <Trash2 class="size-4" aria-hidden="true" />Remove
        </button>
      </div>
    </div>
  </li>
</template>
