<script setup lang="ts">
import { computed } from 'vue'
import type { Visit } from '~/composables/useVisits'
import { useStoreInbox } from '~/composables/useStoreInbox'
import { visitDogNames } from '~/composables/useVisits'
import { todayIso, visitDay } from '~/utils/time'

// Coming up: kennel visits from today on, requests and confirmed, grouped by day. The one dark card on the page.
const { upcoming } = useStoreInbox()

const days = computed(() => {
  const groups = new Map<string, Visit[]>()
  for (const v of upcoming.value.slice(0, 6)) groups.set(v.day, [...(groups.get(v.day) ?? []), v])
  return [...groups].map(([day, visits]) => ({ day, ...visitDay(day), today: day === todayIso(), visits }))
})
</script>

<template>
  <section class="flex flex-col gap-4 rounded-xl bg-night p-5 text-on-night">
    <header class="flex items-baseline justify-between gap-3">
      <h2 class="m-0 font-display text-lg leading-6 font-extrabold font-stretch-expanded">Coming up</h2>
      <NuxtLink to="/dashboard/bookings" class="text-[13px] font-bold text-marigold underline underline-offset-4">All bookings</NuxtLink>
    </header>

    <ol v-if="days.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="(d, i) in days" :key="d.day" class="relative flex gap-4 pb-4 last:pb-0">
        <!-- Day marker on a dashed patrol line -->
        <span class="relative flex w-11 shrink-0 flex-col items-center">
          <span :class="['z-10 flex w-11 flex-col items-center rounded-md py-1', d.today ? 'bg-marigold text-on-marigold' : 'bg-on-night/10']">
            <span class="font-mono text-[10px] font-semibold tracking-[.1em] uppercase">{{ d.today ? 'Today' : d.weekday }}</span>
            <span class="mega text-xl leading-none">{{ d.date }}</span>
          </span>
          <span v-if="i < days.length - 1" class="absolute top-12 -bottom-0 border-l-2 border-dashed border-on-night/20" aria-hidden="true" />
        </span>
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <NuxtLink
            v-for="v in d.visits"
            :key="v.id"
            to="/dashboard/bookings"
            class="rounded-lg bg-on-night/5 p-3 text-on-night no-underline ring-1 ring-on-night/10 hover:ring-on-night/30"
          >
            <span class="flex items-baseline justify-between gap-2">
              <strong class="text-sm leading-5">{{ v.service }}</strong>
              <span class="font-mono text-xs text-marigold">{{ v.slot }}</span>
            </span>
            <span class="block text-[13px] leading-5">{{ v.buyerName }}<template v-if="v.dogFileNos.length"> · {{ visitDogNames(v.dogFileNos) }}</template></span>
            <span class="block text-[13px] leading-5 opacity-70">
              {{ v.place === 'home' ? 'At the buyer\'s home' : 'At the kennel' }}<template v-if="v.status === 'requested'"> · <strong class="font-semibold text-marigold">Needs your answer</strong></template>
            </span>
          </NuxtLink>
        </div>
      </li>
    </ol>
    <p v-else class="m-0 text-sm leading-[21px] opacity-70">Nothing booked yet. Visit requests from buyers show up here.</p>
  </section>
</template>
