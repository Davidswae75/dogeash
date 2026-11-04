<script setup lang="ts">
import { CalendarClock, Dog, FileCheck2, MessageSquareReply } from '@lucide/vue'
import { computed } from 'vue'
import type { AdminOverview } from '~/utils/admin'
import { count } from '~/utils/admin'

// What's waiting: Dogeash's own queues first (marked), then stores that are slow to answer buyers
const props = defineProps<{ o: AdminOverview }>()
const rows = computed(() => [
  { icon: FileCheck2, n: props.o.waiting.storesInReview, label: 'Store applications', hint: 'Waiting for Dogeash to review', ours: true },
  { icon: Dog, n: props.o.waiting.dogsPendingReview, label: 'Listings pending review', hint: 'Dogs sent for a check before going live', ours: true },
  { icon: CalendarClock, n: props.o.waiting.visitsUnanswered, label: 'Unanswered visit requests', hint: 'Stores silent for over 2 days', ours: false },
  { icon: MessageSquareReply, n: props.o.waiting.reviewsUnanswered, label: 'Reviews without a reply', hint: 'Stores that haven\'t answered buyers', ours: false },
])
const ours = computed(() => rows.value.filter(r => r.ours).reduce((s, r) => s + r.n, 0))
</script>

<template>
  <AdminCard title="Needs attention" :description="ours ? `${ours} waiting on Dogeash` : 'Nothing waiting on Dogeash'" flush>
    <ul class="m-0 flex list-none flex-col p-0">
      <li v-for="r in rows" :key="r.label" class="flex items-center gap-3.5 border-t border-line px-5 py-3">
        <span :class="['grid size-9 shrink-0 place-items-center rounded-xl', r.n && r.ours ? 'bg-marigold text-on-marigold' : 'bg-surface-sunk text-ink-muted']">
          <component :is="r.icon" class="size-[17px]" aria-hidden="true" />
        </span>
        <span class="flex min-w-0 flex-1 flex-col leading-tight">
          <span class="text-[13.5px] font-medium">{{ r.label }}</span>
          <span class="text-[12px] text-ink-muted">{{ r.hint }}</span>
        </span>
        <span :class="['font-mono text-xl font-semibold tabular-nums', r.n ? 'text-ink' : 'text-ink-muted/60']">{{ count(r.n) }}</span>
      </li>
    </ul>
  </AdminCard>
</template>
