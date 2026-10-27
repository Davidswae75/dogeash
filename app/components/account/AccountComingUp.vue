<script setup lang="ts">
import { cn } from '~/lib/utils'

// Kennel visits and care appointments, soonest first, each with its date in a calendar block
const bookings = sampleBookings
const dayParts = (day: string) => {
  const [weekday, date, month] = day.split(' ')
  return { weekday, date, month }
}
</script>

<template>
  <SectionPanel title="Coming up" :meta="`${bookings.length} booked`">
    <ul v-if="bookings.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="b in bookings" :key="b.id">
        <NuxtLink :to="b.to" class="flex items-center gap-4 rounded-lg p-3 text-ink no-underline hover:bg-surface-sunk">
          <span class="flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-md ring-1 ring-line-strong">
            <span class="w-full bg-night py-0.5 text-center font-mono text-[10px] font-semibold tracking-[.1em] text-on-night uppercase">{{ dayParts(b.day).weekday }}</span>
            <span class="pt-1 font-display text-[22px] leading-none font-extrabold">{{ dayParts(b.day).date }}</span>
            <span class="pb-1 font-mono text-[10px] font-semibold tracking-[.1em] text-ink-muted uppercase">{{ dayParts(b.day).month }}</span>
          </span>
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <strong class="text-[15px] leading-5">{{ b.kind }} · {{ b.time }}</strong>
              <span
                :class="cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold', b.status === 'confirmed' ? 'bg-marigold-soft text-ink' : 'bg-ash-soft text-ink-muted')"
              >
                <span :class="cn('size-1.5 rounded-full', b.status === 'confirmed' ? 'bg-marigold' : 'bg-ash')" aria-hidden="true" />{{ b.status === 'confirmed' ? 'Confirmed' : 'Awaiting reply' }}
              </span>
            </span>
            <span class="truncate text-[13px] text-ink-muted">{{ b.with }} · {{ b.where }}</span>
            <span class="truncate text-[13px] text-ink-muted">{{ b.detail }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="m-0 p-4 text-sm text-ink-muted">Nothing booked yet. Book a kennel visit from your shortlist to meet the dogs.</p>
  </SectionPanel>
</template>
