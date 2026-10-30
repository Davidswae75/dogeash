<script setup lang="ts">
import { Dumbbell, Hammer, House, Package, Scissors, Stethoscope } from '@lucide/vue'
import type { Component } from 'vue'
import type { CareType } from '~/utils/care'

const props = defineProps<{ type: CareType }>()

const icons: Record<CareType, Component> = {
  vet: Stethoscope, trainer: Dumbbell, groomer: Scissors, builder: Hammer, equipment: Package, boarding: House,
}
</script>

<template>
  <span class="grid size-11 shrink-0 place-items-center rounded-full bg-ash-soft text-ink">
    <component :is="icons[props.type]" class="size-5" aria-hidden="true" />
  </span>
</template>
