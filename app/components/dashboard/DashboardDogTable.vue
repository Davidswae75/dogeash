<script setup lang="ts">
import { Dog as DogIcon } from '@lucide/vue'
import type { StoreDog } from '~/utils/dogs'
import type { ListingStatus } from '~/utils/k9'
import { formatNaira } from '~/utils/dogs'
import { shortTime } from '~/utils/time'

// The store's dogs as a table: photo, name and file number, level, status, price, last change, actions
const props = defineProps<{ dogs: StoreDog[], verified: boolean, canDelete: boolean }>()
const emit = defineEmits<{ status: [dog: StoreDog, to: ListingStatus], remove: [dog: StoreDog] }>()
</script>

<template>
  <!-- relative: keeps the hidden column label inside this scroller, or it widens the whole page on phones -->
  <div class="relative overflow-x-auto rounded-xl bg-surface ring-1 ring-line">
    <table class="w-full min-w-[640px] border-collapse text-left text-sm">
      <thead>
        <tr class="font-mono text-[10.5px] tracking-[.12em] text-ink-muted uppercase">
          <th scope="col" class="px-4 py-3 font-semibold">Dog</th>
          <th scope="col" class="px-3 py-3 font-semibold">Level</th>
          <th scope="col" class="px-3 py-3 font-semibold">Status</th>
          <th scope="col" class="px-3 py-3 text-right font-semibold">Price</th>
          <th scope="col" class="px-3 py-3 text-right font-semibold">Changed</th>
          <th scope="col" class="w-12"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dog in props.dogs" :key="dog.id" class="border-t border-line hover:bg-surface-sunk">
          <td class="px-4 py-2.5">
            <NuxtLink :to="`/dashboard/dogs/${dog.fileNo.toLowerCase()}`" class="flex items-center gap-3 text-ink no-underline">
              <img v-if="dog.photo" :src="dog.photo" alt="" class="size-11 rounded-md object-cover">
              <span v-else class="grid size-11 place-items-center rounded-md bg-surface-sunk text-ink-muted"><DogIcon class="size-5" aria-hidden="true" /></span>
              <span class="min-w-0">
                <strong class="block leading-5">{{ dog.name }}</strong>
                <span class="font-mono text-[11px] whitespace-nowrap text-ink-muted">{{ dog.fileNo }} · {{ dog.breed }}</span>
              </span>
            </NuxtLink>
          </td>
          <td class="px-3 py-2.5 font-semibold">{{ dog.level }}</td>
          <td class="px-3 py-2.5"><ListingStatusChip :status="dog.status" /></td>
          <td class="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">{{ formatNaira(dog.priceNaira) }}</td>
          <td class="px-3 py-2.5 text-right font-mono text-[12px] text-ink-muted">{{ shortTime(dog.updatedAt) }}</td>
          <td class="pr-3 text-right">
            <DashboardDogActions :dog="dog" :verified="props.verified" :can-delete="props.canDelete" @status="to => emit('status', dog, to)" @remove="emit('remove', dog)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
