<script setup lang="ts">
// Three facts in mono between hairlines: age, weight, hips (or rating, dogs, replies)
const props = defineProps<{ facts: { label: string, value: string | number }[] }>()
</script>

<template>
  <dl class="m-0 grid grid-cols-3 border-y border-line">
    <div
      v-for="fact in props.facts"
      :key="fact.label"
      class="flex flex-col gap-0.5 py-2 not-first:border-l not-first:border-line not-first:pl-3"
    >
      <dt class="text-[10px] leading-3 font-bold tracking-[.08em] text-ink-muted uppercase">{{ fact.label }}</dt>
      <dd class="m-0 font-mono text-sm leading-5 font-semibold tabular-nums">{{ fact.value }}</dd>
    </div>
  </dl>
</template>
