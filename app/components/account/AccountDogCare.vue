<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue'
import type { OwnedDog } from '~/utils/myDogs'

// Side column of a dog's record: reminders, most urgent first, and the health guarantee
const props = defineProps<{ dog: OwnedDog }>()
const store = computed(() => getStore(props.dog.storeId))
const reminders = computed(() => sortedReminders(props.dog))
const g = computed(() => props.dog.guarantee)
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-5">
    <AccountPanel title="Reminders" :meta="`${reminders.length} set`">
      <ul class="m-0 flex list-none flex-col p-0">
        <li v-for="r in reminders" :key="r.title" class="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="text-sm font-semibold">{{ r.title }}</span>
            <span class="font-mono text-[11px] text-ink-muted">{{ r.due }}</span>
          </span>
          <AccountCareChip :status="r.status" />
        </li>
      </ul>
    </AccountPanel>

    <section class="flex flex-col gap-3 rounded-xl bg-night p-5 text-on-night">
      <span class="flex items-center justify-between font-mono text-[10.5px] font-semibold tracking-[.12em] uppercase opacity-80">
        Health guarantee <ShieldCheck class="size-4 text-marigold" aria-hidden="true" />
      </span>
      <strong class="font-display text-2xl leading-7 font-extrabold font-stretch-expanded">{{ g.monthsLeft }} months left</strong>
      <div class="h-1.5 overflow-hidden rounded-full bg-on-night/15" role="progressbar" :aria-valuenow="g.monthsLeft" aria-valuemin="0" :aria-valuemax="g.months" aria-label="Guarantee remaining">
        <div class="h-full rounded-full bg-marigold" :style="{ width: `${(g.monthsLeft / g.months) * 100}%` }" />
      </div>
      <p class="m-0 text-[13px] leading-[19px] opacity-80">{{ g.covers }}. From {{ store?.name }}, until {{ g.until }}.</p>
    </section>
  </div>
</template>
