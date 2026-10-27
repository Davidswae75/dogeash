<script setup lang="ts">
// Coming up: visits, handovers and vet checks, grouped by day. The one dark card on the page.
const days = computed(() => {
  const groups = new Map<string, typeof dashboardUpcoming[number][]>()
  for (const e of dashboardUpcoming) groups.set(`${e.day} ${e.date}`, [...(groups.get(`${e.day} ${e.date}`) ?? []), e])
  return [...groups].map(([key, events]) => ({ key, day: events[0]!.day, date: events[0]!.date, today: events[0]!.day === dashboardToday.weekday, events }))
})
</script>

<template>
  <section class="flex flex-col gap-4 rounded-xl bg-night p-5 text-on-night">
    <header class="flex items-baseline justify-between gap-3">
      <div class="flex items-baseline gap-2.5">
        <h2 class="m-0 font-display text-lg leading-6 font-extrabold font-stretch-expanded">Coming up</h2>
        <span class="font-mono text-[10.5px] font-semibold tracking-[.12em] uppercase opacity-70">This week</span>
      </div>
      <NuxtLink to="/dashboard/bookings" class="text-[13px] font-bold text-marigold underline underline-offset-4">All bookings</NuxtLink>
    </header>

    <ol class="m-0 flex list-none flex-col p-0">
      <li v-for="(d, i) in days" :key="d.key" class="relative flex gap-4 pb-4 last:pb-0">
        <!-- Day marker on a dashed patrol line -->
        <span class="relative flex w-11 shrink-0 flex-col items-center">
          <span :class="['z-10 flex w-11 flex-col items-center rounded-md py-1', d.today ? 'bg-marigold text-on-marigold' : 'bg-on-night/10']">
            <span class="font-mono text-[10px] font-semibold tracking-[.1em] uppercase">{{ d.today ? 'Today' : d.day }}</span>
            <span class="mega text-xl leading-none">{{ d.date }}</span>
          </span>
          <span v-if="i < days.length - 1" class="absolute top-12 -bottom-0 border-l-2 border-dashed border-on-night/20" aria-hidden="true" />
        </span>
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <div v-for="e in d.events" :key="e.title + e.time" class="rounded-lg bg-on-night/5 p-3 ring-1 ring-on-night/10">
            <span class="flex items-baseline justify-between gap-2">
              <strong class="text-sm leading-5">{{ e.title }}</strong>
              <span class="font-mono text-xs text-marigold">{{ e.time }}</span>
            </span>
            <span class="block text-[13px] leading-5">{{ e.who }}</span>
            <span class="block text-[13px] leading-5 opacity-70">{{ e.where }}</span>
          </div>
        </div>
      </li>
    </ol>
  </section>
</template>
