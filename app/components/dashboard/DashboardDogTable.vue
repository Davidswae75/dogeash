<script setup lang="ts">
import { Dog as DogIcon, Pin } from '@lucide/vue'
import { useRouter } from '#imports' // nuxt
import type { DataColumn } from '~/components/list/ListTable.vue'
import type { StoreDog } from '~/utils/dogs'
import type { ListingStatus } from '~/utils/k9'
import { dogeashId, formatNaira } from '~/utils/dogs'
import { shortTime } from '~/utils/time'

// The store's dogs as a table (the shared list design): photo, name and Dogeash ID, level, status, price, last
// change, and the ⋯ menu. A row opens the dog's edit page; on phones rows stack as cards.
const props = defineProps<{ dogs: StoreDog[], verified: boolean, canDelete: boolean }>()
const emit = defineEmits<{ status: [dog: StoreDog, to: ListingStatus], remove: [dog: StoreDog], pin: [dog: StoreDog] }>()
const router = useRouter()
const columns: DataColumn[] = [
  { key: 'name', label: 'Dog', mobile: 'title' },
  { key: 'breed', label: 'Breed', mobile: 'meta' },
  { key: 'level', label: 'Level', mobile: 'row', width: 'w-20' },
  { key: 'status', label: 'Status', mobile: 'row' },
  { key: 'updatedAt', label: 'Changed', mono: true, mobile: 'row' },
  { key: 'price', label: 'Price', align: 'right', mono: true, mobile: 'end' },
]
const key = (d: StoreDog) => d.id
const label = (d: StoreDog) => `${d.name}, ${d.breed}`
const open = (d: StoreDog) => router.push(`/dashboard/dogs/${d.fileNo.toLowerCase()}`)
</script>

<template>
  <ListTable :rows="props.dogs" :columns="columns" :row-key="key" :row-label="label" @open="open">
    <template #cell-name="{ row }">
      <span class="flex items-center gap-3">
        <img v-if="row.photo" :src="row.photo" alt="" class="size-11 shrink-0 rounded-lg object-cover">
        <span v-else class="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-sunk text-ink-muted"><DogIcon class="size-5" aria-hidden="true" /></span>
        <span class="flex min-w-0 flex-col">
          <strong class="flex items-center gap-1.5 font-semibold">{{ row.name }}<Pin v-if="row.pinnedAt" class="size-3.5 text-marigold-ink" aria-label="Pinned" /></strong>
          <span class="font-mono text-[11px] whitespace-nowrap text-ink-muted">{{ dogeashId(row.fileNo) }}</span>
        </span>
      </span>
    </template>
    <template #cell-level="{ row }"><span class="grid size-6 place-items-center rounded-md bg-marigold font-mono text-xs font-bold text-on-marigold">{{ row.level }}</span></template>
    <template #cell-status="{ row }"><ListingStatusChip :status="row.status" /></template>
    <template #cell-updatedAt="{ row }"><span class="text-xs text-ink-muted">{{ shortTime(row.updatedAt) }}</span></template>
    <template #cell-price="{ row }"><strong class="font-semibold">{{ formatNaira(row.priceNaira) }}</strong></template>
    <template #actions="{ row }">
      <DashboardDogActions :dog="row" :verified="props.verified" :can-delete="props.canDelete" @status="to => emit('status', row, to)" @remove="emit('remove', row)" @pin="emit('pin', row)" />
    </template>
  </ListTable>
</template>
