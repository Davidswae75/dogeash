<script setup lang="ts">
import { useVisits, visitDogNames } from '~/composables/useVisits'

// Kennel visits still to come, soonest first, each with its day as a calendar leaf
const { upcoming } = useVisits()
</script>

<template>
  <SectionPanel title="Coming up" :meta="`${upcoming.length} booked`">
    <ul v-if="upcoming.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="v in upcoming.slice(0, 3)" :key="v.id">
        <NuxtLink to="/account/visits" class="flex items-center gap-4 rounded-lg p-3 text-ink no-underline hover:bg-surface-sunk">
          <VisitDateBlock :day="v.day" />
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <strong class="text-[15px] leading-5">{{ v.service }} · {{ v.slot }}</strong>
              <VisitStatusChip :status="v.status" />
            </span>
            <span class="truncate text-[13px] text-ink-muted">{{ v.storeName }} · {{ v.place === 'home' ? 'At your home' : 'At the kennel' }}</span>
            <span v-if="v.dogFileNos.length" class="truncate text-[13px] text-ink-muted">Meet {{ visitDogNames(v.dogFileNos) }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="m-0 p-4 text-sm text-ink-muted">Nothing booked yet. Book a kennel visit from your shortlist to meet the dogs.</p>
  </SectionPanel>
</template>
