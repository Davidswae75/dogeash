<script setup lang="ts">
const items = ['Health-checked by a vet', 'Temperament-tested', 'Microchipped', 'Handover training included']
</script>

<template>
  <section aria-label="On every dog" class="flex flex-wrap justify-between gap-x-7 gap-y-2.5 rounded-lg bg-night px-6 py-4 text-sm font-bold text-on-night md:rounded-full md:px-7 md:py-3.5">
    <span v-for="item in items" :key="item" class="inline-flex items-center gap-2">
      <AppIcon name="check" :size="20" class="text-marigold" />{{ item }}
    </span>
  </section>
</template>
