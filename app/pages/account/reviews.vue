<script setup lang="ts">
import { Pencil, Star } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useSeoMeta } from '#imports' // nuxt
import type { ReviewValues } from '~/utils/reviews'
import { useStoreReviews } from '~/composables/useStoreReviews'
import { useVisits } from '~/composables/useVisits'
import { visitDay } from '~/utils/time'

// Reviews: stores waiting for your review (a done kennel visit, no review yet), then the reviews you've
// written, with the store's reply. Write, edit or delete from here; each shows on the store's page.
useSeoMeta({ title: 'Reviews · My Dogeash' })
const reviews = useStoreReviews()
const visits = useVisits()
const loaded = ref(false)
onMounted(async () => {
  await Promise.all([reviews.loadMine(), visits.loadMine()])
  loaded.value = true
})

// One card per store visited, most recent visit first, until it's reviewed
const waiting = computed(() => {
  const reviewed = new Set(reviews.mine.value.map(r => r.storeId))
  const seen = new Map<string, { storeId: string, storeName: string, storeSlug: string, day: string }>()
  for (const v of [...visits.mine.value].sort((a, b) => b.day.localeCompare(a.day))) {
    if (v.status === 'done' && !reviewed.has(v.storeId) && !seen.has(v.storeId)) seen.set(v.storeId, { storeId: v.storeId, storeName: v.storeName, storeSlug: v.storeSlug, day: v.day })
  }
  return [...seen.values()]
})

// The dialog writes a new review or edits one
const open = ref(false)
const target = ref<{ storeId: string, storeName: string }>()
const editing = computed(() => (target.value ? reviews.mine.value.find(r => r.storeId === target.value!.storeId) : undefined))
function write(storeId: string, storeName: string) {
  target.value = { storeId, storeName }
  open.value = true
}
const save = (values: ReviewValues) => reviews.write(target.value!.storeId, target.value!.storeName, values)
async function remove() {
  if (editing.value) await reviews.remove(editing.value)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <AccountHeading kicker="Reviews" title="Your" outline="reviews" text="After a kennel visit, tell other buyers how it went. Your review shows on the store's page with your first name and city." />
    <ListSkeleton v-if="!loaded" :rows="2" label="Loading your reviews" />

    <template v-else>
      <SectionPanel v-if="waiting.length" title="Waiting for your review" :meta="`${waiting.length}`">
        <ul class="m-0 flex list-none flex-col p-0">
          <li v-for="w in waiting" :key="w.storeId" class="flex flex-wrap items-center gap-3 rounded-lg p-3">
            <span class="grid size-11 shrink-0 place-items-center rounded-full bg-marigold-soft"><Star class="size-5" aria-hidden="true" /></span>
            <span class="flex min-w-0 flex-1 flex-col">
              <NuxtLink :to="`/stores/${w.storeSlug}`" class="font-semibold text-ink">{{ w.storeName }}</NuxtLink>
              <span class="text-[13px] text-ink-muted">You visited {{ visitDay(w.day).label }}</span>
            </span>
            <Button variant="marigold" size="sm" @click="write(w.storeId, w.storeName)">Write a review</Button>
          </li>
        </ul>
      </SectionPanel>

      <div v-if="reviews.mine.value.length" class="flex flex-col gap-4">
        <h2 class="m-0 font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">Written · {{ reviews.mine.value.length }}</h2>
        <div v-for="r in reviews.mine.value" :key="r.id" class="flex flex-col gap-2">
          <NuxtLink :to="`/stores/${r.storeSlug}`" class="w-fit font-display text-lg font-extrabold text-ink no-underline font-stretch-expanded hover:underline">{{ r.storeName }}</NuxtLink>
          <ReviewCard :review="r" :store-name="r.storeName">
            <Button variant="outline" size="sm" @click="write(r.storeId, r.storeName)"><Pencil aria-hidden="true" />Edit or delete</Button>
          </ReviewCard>
        </div>
      </div>

      <div v-if="!waiting.length && !reviews.mine.value.length" class="flex flex-col items-center gap-4 rounded-xl bg-surface px-6 py-14 text-center ring-1 ring-line">
        <span class="grid size-14 place-items-center rounded-full bg-marigold-soft"><Star class="size-6" aria-hidden="true" /></span>
        <h2 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">Nothing to review yet</h2>
        <p class="m-0 max-w-[32em] text-[15px] leading-6 text-ink-muted">Once a store marks your kennel visit as done, it shows here so you can tell other buyers how it went.</p>
        <Button as-child><NuxtLink to="/account/visits">Your visits</NuxtLink></Button>
      </div>
    </template>

    <ReviewDialog v-if="target" v-model:open="open" :store-name="target.storeName" :existing="editing" :save="save" :remove="editing ? remove : undefined" />
  </div>
</template>
