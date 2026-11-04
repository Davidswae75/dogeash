<script setup lang="ts">
import { computed } from 'vue'
import type { AdminOverview } from '~/utils/admin'
import { count, sumOf } from '~/utils/admin'

// Supply at a glance: stores from draft to verified, and dog listings from draft to sold
const props = defineProps<{ o: AdminOverview }>()
const stores = computed(() => [
  { key: 'verified', label: 'Verified', value: props.o.stores.verified ?? 0, color: 'var(--cat-1)' },
  { key: 'in_review', label: 'In review', value: props.o.stores.in_review ?? 0, color: 'var(--cat-2)' },
  { key: 'draft', label: 'Draft', value: props.o.stores.draft ?? 0, color: 'var(--cat-3)' },
  { key: 'suspended', label: 'Suspended', value: props.o.stores.suspended ?? 0, color: 'var(--cat-4)' },
])
const dogs = computed(() => [
  { key: 'available', label: 'For sale', value: props.o.dogs.available ?? 0, color: 'var(--cat-1)' },
  { key: 'reserved', label: 'Reserved', value: props.o.dogs.reserved ?? 0, color: 'var(--cat-2)' },
  { key: 'drafts', label: 'Drafts', value: sumOf(props.o.dogs, 'draft', 'pending_review'), color: 'var(--cat-3)' },
  { key: 'sold', label: 'Sold', value: props.o.dogs.sold ?? 0, color: 'var(--cat-4)' },
  { key: 'withdrawn', label: 'Withdrawn', value: props.o.dogs.withdrawn ?? 0, color: 'var(--cat-5)' },
])
const total = (parts: { value: number }[]) => parts.reduce((s, p) => s + p.value, 0)
</script>

<template>
  <AdminCard title="Supply" description="Stores and dog listings by where they are">
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-2.5">
        <span class="flex items-baseline justify-between"><span class="text-[13px] font-medium">Stores</span><span class="font-mono text-xs text-ink-muted">{{ count(total(stores)) }} in all</span></span>
        <AdminChartSegmentedBar :parts="stores" />
      </div>
      <div class="flex flex-col gap-2.5">
        <span class="flex items-baseline justify-between"><span class="text-[13px] font-medium">Dog listings</span><span class="font-mono text-xs text-ink-muted">{{ count(total(dogs)) }} in all</span></span>
        <AdminChartSegmentedBar :parts="dogs" />
      </div>
    </div>
  </AdminCard>
</template>
