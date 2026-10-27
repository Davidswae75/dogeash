<script setup lang="ts">
import { MapPin } from '@lucide/vue'
import type { Dog } from '~/utils/dogs'
import type { Store } from '~/utils/stores'

// Shortlisted dogs from one store, with one kennel visit to see them all
const props = defineProps<{ store: Store, dogs: Dog[] }>()

const names = computed(() => props.dogs.map(d => d.name).join(', '))
const visitServices = ['Meet the dogs', 'Meet the dogs and see protection work']
</script>

<template>
  <section class="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
    <header class="flex flex-wrap items-center gap-4 border-b border-line bg-canvas/60 p-4 sm:p-5">
      <StoreAvatar :initials="props.store.initials" class="size-11 rounded-xl" />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink :to="`/stores/${props.store.slug}`" class="font-display text-lg leading-6 font-extrabold text-ink no-underline font-stretch-expanded hover:underline">{{ props.store.name }}</NuxtLink>
          <AppIcon v-if="props.store.verified" name="shield" :size="16" class="text-verified" aria-label="Verified store" />
        </div>
        <span class="inline-flex items-center gap-1 text-[13px] text-ink-muted">
          <MapPin class="size-3.5" aria-hidden="true" />{{ props.store.area }}, {{ props.store.city }} · Replies in {{ props.store.replies }}
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button as-child variant="ghost" size="sm">
          <NuxtLink :to="`/stores/${props.store.slug}`">Ask a question</NuxtLink>
        </Button>
        <BookingDialog
          :title="props.store.name"
          :description="`Kennel visit in ${props.store.area}, ${props.store.city} · ${props.store.hours}`"
          :services="visitServices"
          premises-label="At the kennel"
          :summary="[{ label: props.dogs.length === 1 ? 'Dog' : 'Dogs', value: names }]"
          :trigger-label="props.dogs.length === 1 ? 'Book a kennel visit' : `Book one visit for ${props.dogs.length} dogs`"
          trigger-variant="default"
          price-note="Kennel visits are free. The store confirms the time with you."
        />
      </div>
    </header>
    <ul class="m-0 flex list-none flex-col divide-y divide-line p-0">
      <ShortlistItem v-for="dog in props.dogs" :key="dog.fileNo" :dog="dog" />
    </ul>
  </section>
</template>
