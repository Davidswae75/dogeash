<script setup lang="ts">
import type { Store } from '~/utils/stores'

// Store summary: on a dog's K9 file (compact) or anywhere a store needs a short introduction
const props = withDefaults(defineProps<{ store: Store, compact?: boolean }>(), { compact: false })
const summary = computed(() => storeSummary(props.store))
</script>

<template>
  <div class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6">
    <div class="flex items-center gap-3.5">
      <StoreAvatar :initials="props.store.initials" />
      <div class="min-w-0">
        <NuxtLink :to="`/stores/${props.store.slug}`" class="font-display text-[19px] leading-6 font-bold text-ink no-underline [font-stretch:110%] hover:underline">{{ props.store.name }}</NuxtLink>
        <div class="text-sm leading-[22px] text-ink-muted">
          {{ props.store.city }} · {{ props.store.verified ? `Inspected ${props.store.inspection.date}` : 'Inspection booked' }}
        </div>
      </div>
      <Badge v-if="props.store.verified" variant="verified" class="ml-auto">
        <AppIcon name="shield" :size="14" />Verified
      </Badge>
    </div>

    <FactRow
      :facts="[
        { label: 'Rating', value: props.store.reviews ? `${props.store.rating} · ${props.store.reviews}` : 'New' },
        { label: 'Dogs', value: summary.dogs.length },
        { label: 'Replies', value: props.store.replies },
      ]"
    />

    <div class="flex flex-wrap gap-2">
      <ContactStoreDialog v-if="!props.compact" :store="props.store" variant="default" size="sm" />
      <Button as-child variant="outline" size="sm">
        <NuxtLink :to="`/stores/${props.store.slug}`">Visit store <AppIcon name="arrow-right" :size="16" /></NuxtLink>
      </Button>
    </div>
  </div>
</template>
