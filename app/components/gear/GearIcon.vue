<script setup lang="ts">
import { Bone, Fence, Link2, Pill, Shield, Soup } from '@lucide/vue'
import type { Component } from 'vue'
import type { GearCategory } from '~/utils/gear'

// Product photo, or a category icon on a colour block when there is no photo.
// Decorative either way: the product name always sits next to it.
const props = defineProps<{ category: GearCategory, image?: string }>()

const look: Record<GearCategory, { icon: Component, tone: string }> = {
  harness: { icon: Shield, tone: 'bg-night text-marigold' },
  collar: { icon: Link2, tone: 'bg-marigold text-on-marigold' },
  kennel: { icon: Fence, tone: 'bg-ash text-on-ash' },
  bowl: { icon: Soup, tone: 'bg-ash-soft text-ink' },
  food: { icon: Bone, tone: 'bg-marigold-soft text-ink' },
  health: { icon: Pill, tone: 'bg-surface-sunk text-ink' },
}
</script>

<template>
  <div :class="['relative grid place-items-center overflow-hidden', look[props.category].tone]" aria-hidden="true">
    <img v-if="props.image" :src="props.image" alt="" class="absolute inset-0 size-full object-cover">
    <component :is="look[props.category].icon" v-else class="size-[38%]" :stroke-width="1.5" />
  </div>
</template>
