<script setup lang="ts">
import type { DataColumn } from '~/components/list/ListTable.vue'
import type { ProviderBooking } from '~/composables/useProviderDashboard'
import { careBookingStatus } from '~/composables/useCareBookings'
import { visitDay } from '~/utils/time'

// The provider's bookings as a table (the shared list design): when, services, buyer, dog, where, status.
// A row opens the details; on phones rows stack as cards.
const props = defineProps<{ bookings: ProviderBooking[] }>()
const emit = defineEmits<{ open: [booking: ProviderBooking] }>()
const columns: DataColumn[] = [
  { key: 'service', label: 'Services', mobile: 'title' },
  { key: 'when', label: 'When', mobile: 'meta' },
  { key: 'buyerName', label: 'Buyer', mobile: 'row' },
  { key: 'dogName', label: 'Dog', mobile: 'row' },
  { key: 'place', label: 'Where', mobile: 'row' },
  { key: 'status', label: 'Status', mobile: 'end' },
]
const key = (b: ProviderBooking) => b.id
const label = (b: ProviderBooking) => `${b.service}, ${b.buyerName}, ${visitDay(b.day).label} at ${b.slot}`
</script>

<template>
  <ListTable :rows="props.bookings" :columns="columns" :row-key="key" :row-label="label" @open="b => emit('open', b)">
    <template #cell-service="{ row }"><span class="line-clamp-2 max-w-[260px] font-semibold">{{ row.service }}</span></template>
    <template #cell-when="{ row }"><span class="whitespace-nowrap">{{ visitDay(row.day).label }} · <span class="font-mono">{{ row.slot }}</span></span></template>
    <template #cell-buyerName="{ row }">
      <span class="flex flex-col"><span>{{ row.buyerName }}</span><span v-if="row.buyerPhone" class="font-mono text-xs text-ink-muted">{{ row.buyerPhone }}</span></span>
    </template>
    <template #cell-dogName="{ row }">{{ row.dogName || '—' }}</template>
    <template #cell-place="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ row.place === 'home' ? 'Their home' : 'Your premises' }}</span></template>
    <template #cell-status="{ row }">
      <span :class="['rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap', careBookingStatus[row.status as ProviderBooking['status']].tone]">{{ careBookingStatus[row.status as ProviderBooking['status']].label }}</span>
    </template>
  </ListTable>
</template>
