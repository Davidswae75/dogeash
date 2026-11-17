<script setup lang="ts">
import { Dog as DogIcon, Pin } from '@lucide/vue'
import type { StoreDog } from '~/utils/dogs'
import type { ListingStatus } from '~/utils/k9'
import { dogeashId, formatNaira } from '~/utils/dogs'

// The store's dogs as photo cards: for checking how listings look. The card opens the dog's edit page;
// the ⋯ menu sits on the photo.
const props = defineProps<{ dogs: StoreDog[], verified: boolean, canDelete: boolean }>()
const emit = defineEmits<{ status: [dog: StoreDog, to: ListingStatus], remove: [dog: StoreDog], pin: [dog: StoreDog] }>()
</script>

<template>
  <ul class="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
    <li v-for="d in props.dogs" :key="d.id" class="relative">
      <NuxtLink :to="`/dashboard/dogs/${d.fileNo.toLowerCase()}`" class="flex h-full flex-col overflow-hidden rounded-xl bg-surface text-ink no-underline ring-1 ring-line hover:ring-ink">
        <div class="relative aspect-[4/3] bg-surface-sunk">
          <img v-if="d.photo" :src="d.photo" alt="" class="size-full object-cover">
          <span v-else class="grid size-full place-items-center text-ink-muted"><DogIcon class="size-8" aria-hidden="true" /></span>
          <span v-if="d.pinnedAt" class="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-marigold px-2 py-0.5 text-[10px] font-bold text-on-marigold uppercase"><Pin class="size-3" aria-hidden="true" />Pinned</span>
        </div>
        <div class="flex flex-1 flex-col gap-1.5 p-3">
          <span class="flex items-center justify-between gap-2">
            <strong class="truncate font-display text-[15px] font-extrabold">{{ d.name }}</strong>
            <span class="grid size-6 shrink-0 place-items-center rounded-md bg-marigold font-mono text-xs font-bold text-on-marigold" :title="`Level ${d.level}`">{{ d.level }}</span>
          </span>
          <span class="truncate text-xs text-ink-muted">{{ d.breed }} · <span class="font-mono">{{ dogeashId(d.fileNo) }}</span></span>
          <span class="mt-auto flex items-center justify-between gap-2 pt-1.5">
            <ListingStatusChip :status="d.status" />
            <strong class="font-mono text-[13px] tabular-nums">{{ formatNaira(d.priceNaira) }}</strong>
          </span>
        </div>
      </NuxtLink>
      <div class="absolute top-2 right-2 rounded-full bg-surface/90 backdrop-blur">
        <DashboardDogActions :dog="d" :verified="props.verified" :can-delete="props.canDelete" @status="to => emit('status', d, to)" @remove="emit('remove', d)" @pin="emit('pin', d)" />
      </div>
    </li>
  </ul>
</template>
