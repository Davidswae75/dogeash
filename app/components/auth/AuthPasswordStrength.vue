<script setup lang="ts">
// Four bars that fill as a new password gets stronger
const props = defineProps<{ password?: string }>()

const levels = [
  { label: '', tone: '' },
  { label: 'Weak', tone: 'bg-danger' },
  { label: 'Fair', tone: 'bg-marigold' },
  { label: 'Good', tone: 'bg-action' },
  { label: 'Strong', tone: 'bg-action' },
]
const score = computed(() => passwordStrength(props.password ?? ''))
const level = computed(() => levels[score.value]!)
</script>

<template>
  <div class="flex items-center gap-3" aria-live="polite">
    <span class="flex flex-1 gap-1" aria-hidden="true">
      <i v-for="n in 4" :key="n" :class="['h-1.5 flex-1 rounded-full transition-colors duration-300', n <= score ? level.tone : 'bg-line']" />
    </span>
    <span :class="['shrink-0 text-xs', score ? 'font-bold' : 'text-ink-muted']">{{ level.label || 'At least 8 characters and a number' }}</span>
  </div>
</template>
