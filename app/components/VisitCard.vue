<script setup lang="ts">
import { Clock, Dog, Home, MapPin, MessageSquareQuote, Store, UserRound } from '@lucide/vue'
import { computed } from 'vue'
import type { Visit } from '~/composables/useVisits'
import { visitDogNames } from '~/composables/useVisits'
import { cn } from '~/lib/utils'
import { visitDay } from '~/utils/time'

// One kennel visit: the day as a calendar leaf, what it is and its status, then who, where, when and which
// dogs as short lines, any notes, and the actions (cancel, confirm, review…) along the bottom.
// `side` picks who it's described for: the buyer sees the store, the store sees the buyer.
// `muted` is for visits that are over; `bare` drops the card frame, inside another panel.
const props = defineProps<{ visit: Visit, side: 'buyer' | 'store', muted?: boolean, bare?: boolean }>()
const day = computed(() => visitDay(props.visit.day))
const place = computed(() => (props.visit.place === 'home'
  ? (props.side === 'buyer' ? 'At your home' : 'At the buyer\'s home')
  : 'At the kennel'))
const dogs = computed(() => (props.visit.dogFileNos.length ? visitDogNames(props.visit.dogFileNos) : ''))
</script>

<template>
  <article :class="cn('flex flex-col', !props.bare && 'rounded-xl bg-surface ring-1 ring-line')">
    <div :class="cn('flex items-start gap-4', !props.bare && 'p-4 sm:p-5')">
      <VisitDateBlock :day="props.visit.day" :muted="props.muted" />
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <strong :class="cn('text-[15px] leading-5', props.muted && 'text-ink-muted')">{{ props.visit.service }}</strong>
          <VisitStatusChip :status="props.visit.status" />
        </div>
        <ul class="m-0 grid list-none gap-1.5 p-0 text-[13px] leading-[18px] text-ink-muted sm:grid-cols-2">
          <li class="flex min-w-0 items-center gap-2">
            <component :is="props.side === 'buyer' ? Store : UserRound" class="size-3.5 shrink-0" aria-hidden="true" />
            <NuxtLink v-if="props.side === 'buyer'" :to="`/stores/${props.visit.storeSlug}`" class="truncate font-semibold text-ink">{{ props.visit.storeName }}</NuxtLink>
            <span v-else class="truncate">
              <strong class="font-semibold text-ink">{{ props.visit.buyerName }}</strong><template v-if="props.visit.buyerPhone"> · <a :href="`tel:${props.visit.buyerPhone}`" class="text-ink">{{ props.visit.buyerPhone }}</a></template>
            </span>
          </li>
          <li class="flex min-w-0 items-center gap-2">
            <Clock class="size-3.5 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ day.label }} · <span class="font-mono text-ink">{{ props.visit.slot }}</span></span>
          </li>
          <li class="flex min-w-0 items-center gap-2">
            <component :is="props.visit.place === 'home' ? Home : MapPin" class="size-3.5 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ place }}</span>
          </li>
          <li v-if="dogs" class="flex min-w-0 items-center gap-2">
            <Dog class="size-3.5 shrink-0" aria-hidden="true" />
            <span class="truncate">Meeting {{ dogs }}</span>
          </li>
        </ul>
        <p v-if="props.visit.note" class="m-0 border-l-2 border-line-strong pl-3 text-[13px] leading-[18px] text-ink-muted">“{{ props.visit.note }}”</p>
        <p v-if="props.visit.storeNote" class="m-0 flex gap-2 rounded-lg bg-surface-sunk p-2.5 text-[13px] leading-[18px] text-ink">
          <MessageSquareQuote class="mt-px size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span><strong class="font-semibold">{{ props.side === 'buyer' ? props.visit.storeName : 'Your note' }}:</strong> {{ props.visit.storeNote }}</span>
        </p>
      </div>
    </div>
    <!-- Actions sit along the bottom, under the whole card -->
    <div v-if="$slots.default" :class="cn('flex flex-wrap gap-2 border-t border-line', props.bare ? 'pt-3' : 'px-4 py-3 sm:px-5')">
      <slot />
    </div>
  </article>
</template>
