<script setup lang="ts">
import type { AdminOverview } from '~/utils/admin'
import { shortTime } from '~/utils/time'

// The latest reviews across all stores, newest first
const props = defineProps<{ reviews: AdminOverview['newest']['reviews'] }>()
</script>

<template>
  <AdminCard title="Newest reviews" flush>
    <ul v-if="props.reviews.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="r in props.reviews" :key="r.id" class="flex flex-col gap-1 border-t border-line px-5 py-3">
        <span class="flex items-center gap-2">
          <ReviewStars :rating="r.rating" />
          <span class="truncate text-[13px] font-medium">{{ r.store }}</span>
          <span class="ml-auto shrink-0 font-mono text-[11px] text-ink-muted">{{ shortTime(r.created_at) }}</span>
        </span>
        <span class="line-clamp-2 text-[12.5px] leading-[18px] text-ink-muted">{{ r.body }}</span>
      </li>
    </ul>
    <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">No reviews yet.</p>
  </AdminCard>
</template>
