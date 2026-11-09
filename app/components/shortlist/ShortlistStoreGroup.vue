<script setup lang="ts">
import { MapPin } from '@lucide/vue'
import type { Dog } from '~/utils/dogs'
import type { Store } from '~/utils/stores'

// Shortlisted dogs from one store, with one kennel visit to see them all
const props = defineProps<{ store: Store, dogs: Dog[] }>()

</script>

<template>
  <section class="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
    <!-- The store, with room to breathe: who and where on the left, the two ways to reach them on the right -->
    <header class="flex flex-col gap-4 border-b border-line bg-canvas/60 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6 lg:px-6">
      <div class="flex min-w-0 flex-1 items-center gap-3.5">
        <StoreAvatar :initials="props.store.initials" :src="props.store.logo" class="size-12 shrink-0 rounded-xl" />
        <div class="flex min-w-0 flex-col gap-1">
          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink :to="`/stores/${props.store.slug}`" class="font-display text-lg leading-6 font-extrabold text-ink no-underline font-stretch-expanded hover:underline">{{ props.store.name }}</NuxtLink>
            <AppIcon v-if="props.store.verified" name="shield" :size="16" class="text-verified" aria-label="Verified store" />
          </div>
          <span class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] leading-5 text-ink-muted">
            <span class="inline-flex items-center gap-1"><MapPin class="size-3.5" aria-hidden="true" />{{ props.store.area }}, {{ props.store.city }}</span>
            <span>Replies in {{ props.store.replies }}</span>
          </span>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
        <ContactStoreDialog :store="props.store" :dog="props.dogs.length === 1 ? props.dogs[0] : undefined" label="Ask a question" variant="ghost" size="sm" />
        <KennelVisitDialog
          :store="props.store"
          :dogs="props.dogs"
          :label="props.dogs.length === 1 ? 'Book a kennel visit' : `Book one visit for ${props.dogs.length} dogs`"
          variant="default"
        />
      </div>
    </header>
    <ul class="m-0 flex list-none flex-col divide-y divide-line p-0">
      <ShortlistItem v-for="dog in props.dogs" :key="dog.fileNo" :dog="dog" />
    </ul>
  </section>
</template>
