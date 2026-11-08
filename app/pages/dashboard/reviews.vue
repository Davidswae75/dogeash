<script setup lang="ts">
import { Star } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useStoreContext } from '~/composables/useStoreContext'
import { useStoreReviews } from '~/composables/useStoreReviews'

// What buyers say about the store, newest first, with a reply under each. Owners and managers reply;
// buyers write reviews after a kennel visit the store marked done.
definePageMeta({ layout: 'dashboard', title: 'Reviews', middleware: 'store-member' })
useSeoMeta({ title: 'Reviews · Store dashboard · Dogeash', robots: 'noindex' })

const { store, can } = useStoreContext()
const reviews = useStoreReviews()
const list = computed(() => reviews.reviewsOf(store.value.id).value)
const loaded = computed(() => reviews.hasLoaded(store.value.id).value)
const average = computed(() => (list.value.length ? (list.value.reduce((sum, r) => sum + r.rating, 0) / list.value.length).toFixed(1) : '–'))
const unanswered = computed(() => list.value.filter(r => !r.reply).length)
onMounted(() => reviews.load(store.value.id))
</script>

<template>
  <DashboardNoAccess v-if="!can('enquiries')" title="Reviews" />
  <div v-else class="flex flex-col gap-5">
    <header class="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl bg-surface px-5 py-4 ring-1 ring-line">
      <span class="flex items-center gap-2">
        <Star class="size-6 fill-marigold text-marigold" aria-hidden="true" />
        <span class="mega text-[32px] leading-none">{{ loaded ? average : '·' }}</span>
      </span>
      <span class="text-sm text-ink-muted">
        <strong class="text-ink">{{ loaded ? list.length : '–' }}</strong> {{ list.length === 1 ? 'review' : 'reviews' }}<template v-if="list.length"> · <strong class="text-ink">{{ unanswered }}</strong> without a reply</template>
      </span>
      <p class="m-0 basis-full text-[13px] leading-5 text-ink-muted">
        Buyers can review {{ store.name }} once you've marked their kennel visit done in Bookings. You can't change or remove a review, but you can reply to each one and change your reply later.
      </p>
    </header>

    <ListSkeleton v-if="!loaded" :rows="2" label="Loading reviews" />
    <div v-else-if="list.length" class="flex flex-col gap-4">
      <ReviewCard v-for="r in list" :key="r.id" :review="r" :store-name="store.name">
        <DashboardReviewReply :review="r" :reply="text => reviews.reply(r, text)" />
      </ReviewCard>
    </div>
    <div v-else class="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-14 text-center ring-1 ring-line">
      <h2 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">No reviews yet</h2>
      <p class="m-0 max-w-[32em] text-[15px] leading-6 text-ink-muted">After a kennel visit, mark it done in Bookings. The buyer can then review your store from their account.</p>
      <Button as-child variant="outline"><NuxtLink to="/dashboard/bookings">Go to Bookings</NuxtLink></Button>
    </div>
  </div>
</template>
