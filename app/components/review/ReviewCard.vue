<script setup lang="ts">
import { MessageSquareQuote, Quote } from '@lucide/vue'
import type { Review } from '~/utils/reviews'
import { reviewDate } from '~/utils/reviews'

// One review: the quote, stars, who wrote it and when, and the store's reply if there is one.
// Actions (edit, delete, reply) go in the default slot.
const props = defineProps<{ review: Review, storeName: string }>()
</script>

<template>
  <figure class="m-0 grid gap-4 rounded-xl bg-surface p-6 ring-1 ring-line sm:grid-cols-[auto_1fr]">
    <Quote class="size-8 text-marigold" aria-hidden="true" />
    <div class="flex min-w-0 flex-col gap-3">
      <blockquote class="m-0 text-[17px] leading-[27px] break-words">{{ props.review.text }}</blockquote>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
        <ReviewStars :rating="props.review.rating" />
        <span>
          <strong class="text-ink">{{ props.review.name }}</strong><template v-if="props.review.city">, {{ props.review.city }}</template> · {{ reviewDate(props.review.at) }}
          <template v-if="props.review.mine"> · <span class="font-semibold text-ink">your review</span></template>
        </span>
      </div>
      <p v-if="props.review.reply" class="m-0 flex gap-2.5 rounded-lg bg-surface-sunk p-3 text-[14px] leading-[21px] text-ink">
        <MessageSquareQuote class="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        <span><strong class="font-semibold">{{ props.storeName }} replied:</strong> {{ props.review.reply }}</span>
      </p>
      <div v-if="$slots.default" class="flex flex-wrap gap-2">
        <slot />
      </div>
    </div>
  </figure>
</template>
