<script setup lang="ts">
// A section of a provider's page they haven't filled in yet: a quiet note for buyers, and for the provider
// themselves (`own`) a link to add it in Your listing
const props = defineProps<{ text: string, own?: boolean, add?: string }>()
</script>

<template>
  <p class="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border-[1.5px] border-dashed border-line-strong px-4 py-3.5 text-[15px] leading-6 text-ink-muted">
    <span>{{ props.text }}</span>
    <NuxtLink v-if="props.own" to="/provider/listing" class="font-bold text-ink underline decoration-marigold decoration-2 underline-offset-4">{{ props.add ?? 'Add it in Your listing' }}</NuxtLink>
  </p>
</template>
