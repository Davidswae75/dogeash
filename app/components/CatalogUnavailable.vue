<script setup lang="ts">
import { RotateCcw, TriangleAlert } from '@lucide/vue'
import { ref } from 'vue'
import { useCatalog } from '~/composables/useCatalog'

// When the dogs, stores and care providers couldn't be read: say so plainly, with a way to try again,
// instead of showing an empty or made-up marketplace
const catalog = useCatalog()
const { failed } = catalog
const busy = ref(false)
async function retry() {
  busy.value = true
  await catalog.load(true)
  busy.value = false
}
</script>

<template>
  <div v-if="failed" class="border-b border-line bg-marigold-soft" role="alert">
    <div class="mx-auto flex max-w-page flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm sm:px-8">
      <TriangleAlert class="size-4 shrink-0" aria-hidden="true" />
      <span class="min-w-0 flex-1"><strong>We can't load the dogs and stores right now.</strong> It's on our side; please try again in a moment.</span>
      <Button size="sm" variant="outline" class="h-8 border-ink" :loading="busy" @click="retry"><RotateCcw aria-hidden="true" />Try again</Button>
    </div>
  </div>
</template>
