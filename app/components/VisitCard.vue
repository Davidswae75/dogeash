<script setup lang="ts">
import { Home, MapPin, MessageSquareQuote } from '@lucide/vue'
import type { Visit } from '~/composables/useVisits'
import { visitDogNames } from '~/composables/useVisits'
import { cn } from '~/lib/utils'
import { visitDay } from '~/utils/time'

// One kennel visit: the day, what and when, with whom, which dogs, and the store's note.
// `side` picks who it's described for: the buyer sees the store, the store sees the buyer.
// Actions (cancel, confirm, decline) go in the default slot. `bare` drops the card frame, inside another panel.
const props = defineProps<{ visit: Visit, side: 'buyer' | 'store', muted?: boolean, bare?: boolean }>()
</script>

<template>
  <article :class="cn('flex gap-4', !props.bare && 'rounded-xl bg-surface p-4 ring-1 ring-line', props.muted && 'opacity-75')">
    <VisitDateBlock :day="props.visit.day" />
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <strong class="text-[15px] leading-5">{{ props.visit.service }} · {{ props.visit.slot }}</strong>
        <VisitStatusChip :status="props.visit.status" />
      </div>
      <div class="flex flex-col gap-1 text-[13px] leading-[18px] text-ink-muted">
        <span v-if="props.side === 'buyer'">
          With <NuxtLink :to="`/stores/${props.visit.storeSlug}`" class="font-semibold text-ink">{{ props.visit.storeName }}</NuxtLink>
        </span>
        <span v-else>
          <strong class="font-semibold text-ink">{{ props.visit.buyerName }}</strong><template v-if="props.visit.buyerPhone"> · <a :href="`tel:${props.visit.buyerPhone}`" class="text-ink">{{ props.visit.buyerPhone }}</a></template>
        </span>
        <span class="flex items-center gap-1.5">
          <component :is="props.visit.place === 'home' ? Home : MapPin" class="size-3.5 shrink-0" aria-hidden="true" />
          {{ props.visit.place === 'home' ? 'At the buyer\'s home' : 'At the kennel' }} · {{ visitDay(props.visit.day).label }}
        </span>
        <span v-if="props.visit.dogFileNos.length">Meeting {{ visitDogNames(props.visit.dogFileNos) }}</span>
      </div>
      <p v-if="props.visit.note" class="m-0 text-[13px] leading-[18px] text-ink-muted italic">"{{ props.visit.note }}"</p>
      <p v-if="props.visit.storeNote" class="m-0 flex gap-2 rounded-lg bg-surface-sunk p-2.5 text-[13px] leading-[18px] text-ink">
        <MessageSquareQuote class="mt-px size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        <span><strong class="font-semibold">{{ props.side === 'buyer' ? props.visit.storeName : 'Your note' }}:</strong> {{ props.visit.storeNote }}</span>
      </p>
      <div v-if="$slots.default" class="flex flex-wrap gap-2 pt-1">
        <slot />
      </div>
    </div>
  </article>
</template>
