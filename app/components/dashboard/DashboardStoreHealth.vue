<script setup lang="ts">
import { Check, Eye } from '@lucide/vue'

// How the store looks to buyers: inspection, rating, reply time, and what's left on the profile
const { store, can } = useStoreContext()
const done = profileChecklist.filter(i => i.done).length
const pct = Math.round((done / profileChecklist.length) * 100)
const todo = profileChecklist.filter(i => !i.done)

const facts = computed(() => [
  { label: 'Inspection', value: store.value.inspection.status === 'passed' ? 'Passed' : 'Booked', sub: store.value.inspection.date },
  { label: 'Rating', value: store.value.reviews ? `${store.value.rating}` : 'New', sub: store.value.reviews ? `${store.value.reviews} reviews` : 'No reviews yet' },
  { label: 'Replies', value: store.value.replies, sub: 'Typical time' },
  { label: 'Placed', value: String(store.value.dogsPlaced), sub: 'Dogs to homes' },
])
</script>

<template>
  <SectionPanel title="Store health" :see-all="`/stores/${store.slug}`" see-all-label="View as buyers">
    <div class="flex flex-col gap-4 p-3">
      <dl class="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line">
        <div v-for="f in facts" :key="f.label" class="flex flex-col gap-0.5 bg-surface px-3 py-2.5">
          <dt class="font-mono text-[10px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ f.label }}</dt>
          <dd class="m-0 font-display text-lg leading-6 font-extrabold font-stretch-expanded">{{ f.value }}</dd>
          <dd class="m-0 text-xs text-ink-muted">{{ f.sub }}</dd>
        </div>
      </dl>

      <div class="flex flex-col gap-2">
        <div class="flex items-baseline justify-between">
          <span class="text-sm font-semibold">Store profile</span>
          <span class="font-mono text-xs text-ink-muted">{{ done }} of {{ profileChecklist.length }} · {{ pct }}%</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100" aria-label="Store profile complete">
          <div class="h-full rounded-full bg-marigold" :style="{ width: `${pct}%` }" />
        </div>
        <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
          <li v-for="item in todo" :key="item.label" class="flex items-center justify-between gap-3 rounded-md bg-marigold-soft px-3 py-2 text-[13px]">
            <span class="font-semibold">{{ item.label }}</span>
            <NuxtLink v-if="can('profile')" to="/dashboard/profile" class="font-bold text-ink underline underline-offset-4">Add</NuxtLink>
          </li>
          <li v-if="!todo.length" class="flex items-center gap-2 text-[13px] text-ink-muted"><Check class="size-4" aria-hidden="true" />Everything's filled in</li>
        </ul>
      </div>

      <NuxtLink :to="`/stores/${store.slug}`" class="group relative block overflow-hidden rounded-lg no-underline">
        <StoreBanner :store="store" class="aspect-[16/5]" />
        <span class="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
          <Eye class="size-3.5" aria-hidden="true" />Your public page
        </span>
      </NuxtLink>
    </div>
  </SectionPanel>
</template>
