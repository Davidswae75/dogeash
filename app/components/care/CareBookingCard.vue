<script setup lang="ts">
import { BookMarked, Clock, Dog, Home, MapPin, MessageSquareQuote, Stethoscope, UserRound } from '@lucide/vue'
import { computed } from 'vue'
import type { CareBookingStatus } from '~/composables/useCareBookings'
import { careBookingStatus } from '~/composables/useCareBookings'
import { cn } from '~/lib/utils'
import { visitDay } from '~/utils/time'

// One care appointment, for either side: the buyer sees the provider (`side="buyer"`), the provider sees
// the buyer and their phone (`side="provider"`). Actions go in the slot.
const props = defineProps<{
  side: 'buyer' | 'provider'
  service: string
  day: string
  slot: string
  place: 'premises' | 'home'
  status: CareBookingStatus
  who: string
  whoTo?: string
  phone?: string | null
  dogName?: string
  shared?: boolean
  note?: string
  providerNote?: string
  muted?: boolean
}>()
const day = computed(() => visitDay(props.day))
const place = computed(() => (props.place === 'home'
  ? (props.side === 'buyer' ? 'At your home' : 'At the buyer\'s home')
  : (props.side === 'buyer' ? 'At their premises' : 'At your premises')))
const status = computed(() => careBookingStatus[props.status])
</script>

<template>
  <article class="flex items-start gap-4 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
    <VisitDateBlock :day="props.day" :muted="props.muted" />
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <strong :class="cn('text-[15px] leading-5', props.muted && 'text-ink-muted')">{{ props.service }}</strong>
        <span :class="['rounded-full px-2.5 py-0.5 text-xs font-bold', status.tone]">{{ status.label }}</span>
      </div>
      <ul class="m-0 grid list-none gap-1.5 p-0 text-[13px] leading-[18px] text-ink-muted sm:grid-cols-2">
        <li class="flex min-w-0 items-center gap-2">
          <component :is="props.side === 'buyer' ? Stethoscope : UserRound" class="size-3.5 shrink-0" aria-hidden="true" />
          <NuxtLink v-if="props.whoTo" :to="props.whoTo" class="truncate font-semibold text-ink">{{ props.who }}</NuxtLink>
          <span v-else class="truncate"><strong class="font-semibold text-ink">{{ props.who }}</strong><template v-if="props.phone"> · <a :href="`tel:${props.phone.replace(/\s/g, '')}`" class="text-ink">{{ props.phone }}</a></template></span>
        </li>
        <li class="flex min-w-0 items-center gap-2">
          <Clock class="size-3.5 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ day.label }} · <span class="font-mono text-ink">{{ props.slot }}</span></span>
        </li>
        <li class="flex min-w-0 items-center gap-2">
          <component :is="props.place === 'home' ? Home : MapPin" class="size-3.5 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ place }}</span>
        </li>
        <li v-if="props.dogName" class="flex min-w-0 items-center gap-2">
          <Dog class="size-3.5 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ props.dogName }}</span>
        </li>
        <li v-if="props.shared" class="flex min-w-0 items-center gap-2 sm:col-span-2">
          <BookMarked class="size-3.5 shrink-0 text-marigold" aria-hidden="true" />
          <span>{{ props.side === 'buyer' ? 'They can add this visit to the dog\'s record' : 'You can add this visit to the dog\'s record' }}</span>
        </li>
      </ul>
      <p v-if="props.note" class="m-0 flex gap-2 text-[13px] leading-5"><MessageSquareQuote class="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />{{ props.note }}</p>
      <p v-if="props.providerNote" class="m-0 rounded-lg bg-surface-sunk px-3 py-2 text-[13px] leading-5"><strong>{{ props.side === 'buyer' ? props.who : 'Your note' }}:</strong> {{ props.providerNote }}</p>
      <div v-if="$slots.default" class="flex flex-wrap gap-2"><slot /></div>
    </div>
  </article>
</template>
