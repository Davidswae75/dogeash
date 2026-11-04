<script setup lang="ts">
import { ArrowDownRight, ArrowUpRight, Minus } from '@lucide/vue'
import { count } from '~/utils/admin'

// A headline number for the chosen period: its change against the period before, and the daily trend.
// Clicking it shows that measure in the activity chart (`active` marks the one shown).
const props = defineProps<{ label: string, value: number, change: number | null, period: string, trend: number[], active: boolean }>()
const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="props.active"
    :class="['group flex min-w-0 cursor-pointer flex-col gap-2.5 rounded-2xl border-0 bg-surface p-3.5 text-left ring-1 transition-shadow sm:gap-3 sm:p-4', props.active ? 'ring-2 ring-ink' : 'ring-line hover:ring-line-strong']"
    @click="emit('select')"
  >
    <span class="flex items-center justify-between gap-2">
      <span class="truncate text-[12.5px] font-medium text-ink-muted">{{ props.label }}</span>
      <span
        v-if="props.change !== null"
        :class="['inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold', props.change > 0 ? 'bg-cat-3/15 text-ink' : props.change < 0 ? 'bg-danger/12 text-danger' : 'bg-surface-sunk text-ink-muted']"
        :title="`${props.change > 0 ? '+' : ''}${props.change}% vs the previous ${props.period}`"
      >
        <component :is="props.change > 0 ? ArrowUpRight : props.change < 0 ? ArrowDownRight : Minus" class="size-3" aria-hidden="true" />{{ Math.abs(props.change) }}%
      </span>
      <span v-else class="font-mono text-[11px] text-ink-muted" title="Nothing in the period before to compare with">new</span>
    </span>
    <span class="font-mono text-[22px] leading-7 font-semibold tracking-tight tabular-nums sm:text-[28px] sm:leading-8">{{ count(props.value) }}</span>
    <AdminChartSparkline :values="props.trend" />
    <span class="hidden text-[11.5px] text-ink-muted sm:block">Last {{ props.period }} · compared with the {{ props.period }} before</span>
  </button>
</template>
