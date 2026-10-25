<script setup lang="ts">
import { cn } from '~/lib/utils'
// A charcoal tour tip with an arrow, step dots, Skip and Next
const props = defineProps<{ step: number, total: number, title: string }>()
const emit = defineEmits<{ skip: [], next: [] }>()
</script>

<template>
  <div role="dialog" aria-label="Tip" class="relative flex max-w-[320px] animate-rise flex-col gap-2 rounded-lg bg-night px-[18px] py-4 text-on-night">
    <span aria-hidden="true" class="absolute -top-1.5 left-7 size-3 rotate-45 bg-night" />
    <span class="text-xs leading-4 font-bold tracking-[.08em] text-marigold uppercase">Tip {{ props.step }} of {{ props.total }}</span>
    <strong class="font-display text-lg leading-[22px] font-extrabold [font-stretch:110%]">{{ props.title }}</strong>
    <p class="m-0 text-sm leading-[21px]"><slot /></p>
    <div class="flex items-center justify-between">
      <span class="flex gap-1.5" aria-hidden="true">
        <i
          v-for="n in props.total"
          :key="n"
          :class="cn('h-1.5 rounded-full', n === props.step ? 'w-[18px] bg-marigold' : 'w-1.5 bg-line-strong')"
        />
      </span>
      <span class="flex gap-1.5">
        <Button variant="night" size="sm" class="border-transparent" @click="emit('skip')">Skip</Button>
        <Button variant="marigold" size="sm" @click="emit('next')">Next</Button>
      </span>
    </div>
  </div>
</template>
