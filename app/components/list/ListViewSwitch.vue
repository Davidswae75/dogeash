<script setup lang="ts">
import { LayoutGrid, Table2 } from '@lucide/vue'
import { computed } from 'vue'

// Grid or table (two icon buttons, named for screen readers and on hover), for lists where both help. The page remembers the choice.
const view = defineModel<'grid' | 'table'>({ default: 'grid' })
const model = computed({ get: () => view.value, set: (v) => { if (v) view.value = v } })
</script>

<template>
  <ToggleGroup v-model="model" type="single" variant="outline" aria-label="View" class="h-10 shrink-0">
    <ToggleGroupItem value="grid" aria-label="Grid" title="Grid" class="h-10 w-10 px-0"><LayoutGrid aria-hidden="true" /><span class="sr-only">Grid</span></ToggleGroupItem>
    <ToggleGroupItem value="table" aria-label="Table" title="Table" class="h-10 w-10 px-0"><Table2 aria-hidden="true" /><span class="sr-only">Table</span></ToggleGroupItem>
  </ToggleGroup>
</template>
