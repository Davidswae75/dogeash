<script setup lang="ts">
import { Bone, Fence, Link2, Pill, Shield, Soup } from '@lucide/vue'
import type { Component } from 'vue'
import type { GearCategory } from '~/utils/gear'

// Category icon on a colour block, standing in until suppliers upload product photos
const props = defineProps<{ category: GearCategory }>()

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
  <div :class="['grid place-items-center', look[props.category].tone]" aria-hidden="true">
    <component :is="look[props.category].icon" class="size-[38%]" :stroke-width="1.5" />
  </div>
</template>
