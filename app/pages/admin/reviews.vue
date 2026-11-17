<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { AdminReview } from '~/utils/admin'
import type { DetailSection } from '~/components/DetailDialog.vue'
import type { DataColumn } from '~/components/list/ListTable.vue'
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
const tabs = computed(() => [
  { value: 'all' as const, label: 'All', count: reviews.value.length },
  { value: 'low' as const, label: '1–2 stars', count: reviews.value.filter(r => r.rating <= 2).length, urgent: true },
  { value: 'high' as const, label: '4–5 stars', count: reviews.value.filter(r => r.rating >= 4).length },
])
const columns: DataColumn[] = [
  { key: 'review', label: 'Review', mobile: 'title' },
  { key: 'store_name', label: 'Store', mobile: 'meta' },
  { key: 'author', label: 'By', mobile: 'row' },
  { key: 'when', label: 'Written', mobile: 'row' },
]
const reviewKey = (r: AdminReview) => r.id
const reviewLabel = (r: AdminReview) => `${r.rating} stars for ${r.store_name}`
function clearFilters() {
  stars.value = 'all'
  query.value = ''
}
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
    </template>

    <div class="flex flex-col gap-4">
      <ListToolbar v-model:search="query" placeholder="Text, store or author" :count="shown.length" :noun="['review', 'reviews']" :filtered="stars !== 'all' || !!query.trim()" @clear="clearFilters">
        <template #tabs><ListTabs v-model="stars" :tabs="tabs" label="Show reviews" /></template>
      </ListToolbar>
      <ListSkeleton v-if="!loaded" variant="table" :rows="5" />
      <p v-else-if="!shown.length" class="m-0 rounded-xl bg-surface px-5 py-8 text-center text-sm text-ink-muted ring-1 ring-line">{{ reviews.length ? 'No reviews match.' : 'No reviews yet.' }}</p>
      <!-- The stars and the start of the review; a row opens the full review, the store's reply and who wrote it -->
      <ListTable v-else :rows="shown" :columns="columns" :row-key="reviewKey" :row-label="reviewLabel" min-width="760px" @open="openReview">
        <template #cell-review="{ row }">
          <span class="flex max-w-[420px] flex-col gap-1">
            <ReviewStars :rating="row.rating" />
            <span class="line-clamp-2 text-[13.5px] leading-5 font-normal break-words">{{ row.body }}</span>
          </span>
        </template>
        <template #cell-author="{ row }"><span class="flex flex-col leading-tight"><span>{{ row.author_name || 'A buyer' }}</span><span v-if="row.store_reply" class="text-xs text-ink-muted">Store replied</span></span></template>
        <template #cell-when="{ row }"><span class="font-mono text-[11.5px] whitespace-nowrap text-ink-muted">{{ adminTime(row.created_at) }}</span></template>
      </ListTable>
    </div>

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
