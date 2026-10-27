<script setup lang="ts">
import { Lock, TrendingDown } from '@lucide/vue'

// Shortlisted dogs that changed since they were saved: reserved by another buyer, or cheaper
const { dogs } = useShortlist()
const changes = computed(() => shortlistChanges(dogs.value))
const link = (fileNo: string) => `/dogs/${fileNo.toLowerCase()}`
</script>

<template>
  <AccountPanel title="On your shortlist" :meta="changes.length ? `${changes.length} changed` : undefined" see-all="/shortlist" see-all-label="Open shortlist">
    <ClientOnly>
      <ul v-if="changes.length" class="m-0 flex list-none flex-col p-0">
        <li v-for="c in changes" :key="c.dog.fileNo">
          <NuxtLink :to="link(c.dog.fileNo)" class="flex items-center gap-4 rounded-lg p-3 text-ink no-underline hover:bg-surface-sunk">
            <span class="relative shrink-0">
              <img v-if="c.dog.photo" :src="c.dog.photo" alt="" :class="['size-14 rounded-md object-cover', c.kind === 'reserved' && 'grayscale']">
              <span
                :class="['absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full ring-[3px] ring-surface', c.kind === 'reserved' ? 'bg-night text-marigold' : 'bg-marigold text-on-marigold']"
              >
                <component :is="c.kind === 'reserved' ? Lock : TrendingDown" class="size-3.5" aria-hidden="true" />
              </span>
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong class="text-[15px] leading-5">{{ c.dog.name }} {{ c.kind === 'reserved' ? 'was reserved' : 'dropped in price' }}</strong>
              <span class="truncate text-[13px] text-ink-muted">{{ c.dog.breed }} · Level {{ c.dog.level }} · {{ c.dog.city }}</span>
              <span v-if="c.kind === 'price'" class="text-[13px]">
                <span class="text-ink-muted line-through">{{ formatNaira(c.was) }}</span>
                <strong class="ml-1.5">{{ formatNaira(c.dog.priceNaira) }}</strong>
              </span>
              <span v-else class="text-[13px] text-ink-muted">Another buyer paid a deposit. It stays saved in case it comes back.</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
      <p v-else-if="dogs.length" class="m-0 p-4 text-sm text-ink-muted">Nothing has changed on the {{ dogs.length }} {{ dogs.length === 1 ? 'dog' : 'dogs' }} you saved. We'll tell you if one is reserved or its price drops.</p>
      <p v-else class="m-0 p-4 text-sm text-ink-muted">Save dogs with the heart and we'll tell you here when one is reserved or its price drops.</p>
    </ClientOnly>
  </AccountPanel>
</template>
