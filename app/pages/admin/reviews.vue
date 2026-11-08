<script setup lang="ts">
import { Search } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { AdminReview } from '~/utils/admin'
import type { DetailSection } from '~/components/DetailDialog.vue'
import type { CsvColumn } from '~/utils/csv'
import { useAdminReviews } from '~/composables/useAdminReviews'
import { useNotify } from '~/composables/useNotify'
import { adminTime } from '~/utils/admin'

// Admin › Reviews: every review on every store, newest first. Removing one needs a reason the author reads;
// the store's rating is worked out again without it, and the review is kept in the audit log.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Reviews · Dogeash admin', robots: 'noindex' })

const { reviews, loaded, load, remove } = useAdminReviews()
onMounted(load)

const stars = ref<'all' | 'low' | 'high'>('all')
const starsModel = computed({ get: () => stars.value, set: (v: string) => { if (v) stars.value = v as 'all' | 'low' | 'high' } })
const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return reviews.value
    .filter(r => stars.value === 'all' || (stars.value === 'low' ? r.rating <= 2 : r.rating >= 4))
    .filter(r => !q || `${r.body} ${r.store_name} ${r.author_name} ${r.author_email ?? ''}`.toLowerCase().includes(q))
})

const pending = ref<AdminReview>()
const csv: CsvColumn<AdminReview>[] = [
  { label: 'Store ID', value: r => r.store_id }, { label: 'Store', value: r => r.store_name }, { label: 'Stars', value: r => r.rating },
  { label: 'Review', value: r => r.body }, { label: 'Author', value: r => r.author_name }, { label: 'Author email', value: r => r.author_email },
  { label: 'Store reply', value: r => r.store_reply }, { label: 'Written', value: r => r.created_at },
]
const confirmOpen = ref(false)

// The whole review in a dialog
const viewing = ref<AdminReview>()
const viewOpen = ref(false)
function openReview(r: AdminReview) {
  viewing.value = r
  viewOpen.value = true
}
const reviewSections = computed<DetailSection[]>(() => {
  const r = viewing.value
  if (!r) return []
  return [
    { title: 'Review', rows: [
      { label: 'Stars', value: `${r.rating} out of 5` },
      { label: 'Written', value: adminTime(r.created_at) },
      { label: 'What they wrote', value: r.body, long: true },
    ] },
    { title: 'Store', rows: [
      { label: 'Store', value: r.store_name, to: `/admin/stores/${r.store_id}` },
      { label: 'Public page', value: 'Open its reviews', to: `/stores/${r.store_slug}#reviews`, external: true },
      { label: 'Replied', value: r.replied_at ? adminTime(r.replied_at) : null },
      { label: 'Store\'s reply', value: r.store_reply, long: true },
    ] },
    { title: 'Author', rows: [
      { label: 'Name', value: [r.author_name || 'A buyer', r.author_city].filter(Boolean).join(', ') },
      { label: 'Email', value: r.author_email, mono: true },
    ] },
  ]
})
function removeFromDialog() {
  viewOpen.value = false
  ask(viewing.value!)
}
function ask(r: AdminReview) {
  pending.value = r
  confirmOpen.value = true
}
async function run(note: string) {
  const error = await remove(pending.value!, note)
  if (!error) useNotify().adminDone('Review removed', `${pending.value!.author_name || 'The author'} has been told why. ${pending.value!.store_name}'s rating is updated.`)
  return error
}
</script>

<template>
  <AdminPage title="Reviews" :count="reviews.length" description="Every review buyers have written. Remove one only when it breaks the rules; the author is told why.">
    <template #actions>
      <AdminExport name="reviews" :rows="shown" :columns="csv" />
      <ToggleGroup v-model="starsModel" type="single" variant="outline" size="sm" aria-label="Show reviews" class="max-w-full flex-wrap justify-start">
        <ToggleGroupItem value="all" class="px-2.5 text-xs">All</ToggleGroupItem>
        <ToggleGroupItem value="low" class="px-2.5 text-xs">1–2 stars</ToggleGroupItem>
        <ToggleGroupItem value="high" class="px-2.5 text-xs">4–5 stars</ToggleGroupItem>
      </ToggleGroup>
      <label class="relative">
        <span class="sr-only">Search reviews</span>
        <Search class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <Input v-model="query" type="search" placeholder="Text, store, author" class="h-9 w-56 pl-8 text-sm" />
      </label>
    </template>

    <ul v-if="shown.length" class="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-3 p-0 xl:grid-cols-2">
      <li v-for="r in shown" :key="r.id">
        <!-- The essentials; clicking opens the full review, the store's reply and who wrote it -->
        <AdminCard class="h-full cursor-pointer transition-shadow hover:ring-line-strong" @click="openReview(r)">
          <div class="flex h-full flex-col gap-2.5 pt-4">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <ReviewStars :rating="r.rating" />
              <span class="text-[13.5px] font-semibold">{{ r.store_name }}</span>
              <span class="ml-auto font-mono text-[11px] text-ink-muted">{{ adminTime(r.created_at) }}</span>
            </div>
            <p class="m-0 line-clamp-2 text-[14px] leading-[21px] break-words">{{ r.body }}</p>
            <div class="mt-auto flex items-center gap-3 border-t border-line pt-3">
              <span class="text-[12.5px]">{{ r.author_name || 'A buyer' }}<span v-if="r.store_reply" class="text-ink-muted"> · store replied</span></span>
              <Button variant="outline" size="sm" class="ml-auto" @click.stop="openReview(r)">Details</Button>
            </div>
          </div>
        </AdminCard>
      </li>
    </ul>
    <ListSkeleton v-else-if="!loaded" variant="card" :rows="3" />
    <p v-else class="m-0 text-sm text-ink-muted">{{ reviews.length ? 'No reviews match.' : 'No reviews yet.' }}</p>

    <DetailDialog v-if="viewing" v-model:open="viewOpen" :title="`${viewing.rating}/5 for ${viewing.store_name}`" :subtitle="`By ${viewing.author_name || 'a buyer'}`" :sections="reviewSections">
      <template #actions>
        <Button variant="outline" class="text-danger" @click="removeFromDialog">Remove review</Button>
      </template>
    </DetailDialog>

    <AdminConfirm
      v-if="pending"
      v-model:open="confirmOpen"
      :title="`Remove this review of ${pending.store_name}?`"
      :description="`${pending.rating}/5 by ${pending.author_name || 'a buyer'}. It disappears from the store page and the store's rating is worked out again. The text is kept in the audit log.`"
      confirm-label="Remove review"
      reason-required
      reason-for="the author"
      danger
      :run="run"
    />
  </AdminPage>
</template>
