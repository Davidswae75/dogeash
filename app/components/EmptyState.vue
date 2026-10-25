<script setup lang="ts">
// No results: the patrol map, one line on what to try, and two ways forward
const props = withDefaults(defineProps<{ title?: string, text?: string }>(), {
  title: 'No dogs match all of those',
  text: 'Try level 3 instead of 4, or we can alert you when a matching dog is listed.',
})
const emit = defineEmits<{ alert: [], clear: [] }>()
</script>

<template>
  <div class="flex flex-col items-center gap-3.5 p-8 text-center">
    <div class="w-[280px]"><PatrolMap /></div>
    <span class="font-display text-2xl font-bold [font-stretch:110%]">{{ props.title }}</span>
    <p class="m-0 max-w-[30em] text-sm leading-[22px] text-ink-muted">{{ props.text }}</p>
    <div class="flex gap-2">
      <Button size="sm" @click="emit('alert')">Alert me</Button>
      <Button variant="outline" size="sm" @click="emit('clear')">Clear filters</Button>
    </div>
  </div>
</template>
