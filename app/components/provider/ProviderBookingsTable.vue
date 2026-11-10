<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import type { ProviderBooking } from '~/composables/useProviderDashboard'
import { careBookingStatus } from '~/composables/useCareBookings'
import { visitDay } from '~/utils/time'

// The provider's bookings as a table: one row each, the whole row opens the details
const props = defineProps<{ bookings: ProviderBooking[] }>()
const emit = defineEmits<{ open: [booking: ProviderBooking] }>()
const th = 'px-3 py-3 font-semibold'
</script>

<template>
  <!-- relative: keeps the hidden column label inside this scroller on phones -->
  <div class="relative overflow-x-auto rounded-xl bg-surface ring-1 ring-line">
    <table class="w-full min-w-[760px] border-collapse text-left text-sm">
      <thead>
        <tr class="font-mono text-[10.5px] tracking-[.12em] text-ink-muted uppercase">
          <th scope="col" :class="[th, 'pl-4']">When</th>
          <th scope="col" :class="th">Services</th>
          <th scope="col" :class="th">Buyer</th>
          <th scope="col" :class="th">Dog</th>
          <th scope="col" :class="th">Where</th>
          <th scope="col" :class="th">Status</th>
          <th scope="col" class="w-10"><span class="sr-only">Open</span></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="b in props.bookings"
          :key="b.id"
          tabindex="0"
          class="cursor-pointer border-t border-line outline-none hover:bg-surface-sunk focus-visible:bg-surface-sunk"
          :aria-label="`${b.service}, ${b.buyerName}, ${visitDay(b.day).label} at ${b.slot}. Open details`"
          @click="emit('open', b)"
          @keydown.enter.prevent="emit('open', b)"
        >
          <td class="py-3 pr-3 pl-4 whitespace-nowrap">
            <strong class="block leading-5">{{ visitDay(b.day).label }}</strong>
            <span class="font-mono text-xs text-ink-muted">{{ b.slot }}</span>
          </td>
          <td class="max-w-[220px] px-3 py-3"><span class="line-clamp-2 font-semibold">{{ b.service }}</span></td>
          <td class="px-3 py-3">
            <span class="block leading-5">{{ b.buyerName }}</span>
            <span v-if="b.buyerPhone" class="font-mono text-xs text-ink-muted">{{ b.buyerPhone }}</span>
          </td>
          <td class="px-3 py-3">{{ b.dogName || '—' }}</td>
          <td class="px-3 py-3 whitespace-nowrap text-ink-muted">{{ b.place === 'home' ? 'Their home' : 'Your premises' }}</td>
          <td class="px-3 py-3"><span :class="['rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap', careBookingStatus[b.status].tone]">{{ careBookingStatus[b.status].label }}</span></td>
          <td class="pr-3 text-right"><ChevronRight class="size-4 text-ink-muted" aria-hidden="true" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
