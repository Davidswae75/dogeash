<script setup lang="ts">
// Big numbers with thick top rules, for facts buyers care about
const props = defineProps<{ stats: { value: string, label: string }[] }>()
</script>

<template>
  <dl class="m-0 grid grid-cols-1 gap-5 md:grid-cols-3 rise-stagger">
    <div
      v-for="stat in props.stats"
      :key="stat.label"
      class="flex animate-rise flex-col-reverse justify-end gap-1.5 border-t-4 border-ink pt-4"
    >
      <dt class="max-w-[18em] text-[15px] leading-[22px] text-ink-muted">{{ stat.label }}</dt>
      <dd class="m-0 mega text-[56px] leading-[.9] tracking-[-.04em] tabular-nums md:text-[clamp(48px,5.2vw,76px)]">{{ stat.value }}</dd>
    </div>
  </dl>
</template>
