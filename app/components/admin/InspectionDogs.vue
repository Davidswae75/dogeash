<script setup lang="ts">
import { Dog as DogIcon } from '@lucide/vue'
import { useRuntimeConfig } from '#imports' // nuxt
import type { InspectionDog } from '~/utils/inspections'
import { dogPhotoUrl } from '~/utils/dogs'
import { protectionLevels } from '~/utils/protection'

// Every dog the store lists: seen on the day or not, its protection level as tested (it replaces the listed
// level when the inspection passes), and a note. `readonly` once finished.
const dogs = defineModel<InspectionDog[]>({ required: true })
const props = defineProps<{ photos: Record<string, string | null>, readonly?: boolean }>()
const storageUrl = useRuntimeConfig().public.supabase.url as string
const set = (i: number, patch: Partial<InspectionDog>) => { dogs.value = dogs.value.map((d, j) => (j === i ? { ...d, ...patch } : d)) }
</script>

<template>
  <AdminCard title="Dogs" :description="`${dogs.filter(d => d.seen).length} of ${dogs.length} seen · dogs seen are marked inspected, with the level you confirm`" flush>
    <ul v-if="dogs.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="(d, i) in dogs" :key="d.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-5 py-3">
        <img v-if="props.photos[d.id]" :src="dogPhotoUrl(props.photos[d.id]!, storageUrl)" alt="" class="size-11 shrink-0 rounded-md object-cover">
        <span v-else class="grid size-11 shrink-0 place-items-center rounded-md bg-surface-sunk text-ink-muted"><DogIcon class="size-5" aria-hidden="true" /></span>
        <span class="flex min-w-[10rem] flex-1 flex-col leading-tight">
          <span class="text-[14px] font-semibold">{{ d.name }}</span>
          <span class="font-mono text-[11px] text-ink-muted">{{ d.file_no }} · {{ d.breed }} · listed L{{ d.listed_level }}</span>
        </span>
        <label class="flex items-center gap-2 text-[13px]"><Switch :model-value="d.seen" :disabled="props.readonly" @update:model-value="v => set(i, { seen: !!v })" />Seen</label>
        <NativeSelect :model-value="String(d.confirmed_level)" :disabled="props.readonly || !d.seen" :aria-label="`Confirmed level for ${d.name}`" class="h-9 w-64 text-sm" @change="(e: Event) => set(i, { confirmed_level: Number((e.target as HTMLSelectElement).value) })">
          <NativeSelectOption v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="String(n)">Level {{ n }} · {{ protectionLevels[n as 1].name }}</NativeSelectOption>
        </NativeSelect>
        <Input :model-value="d.note" :disabled="props.readonly" maxlength="200" placeholder="Note" :aria-label="`Note on ${d.name}`" class="h-9 w-full text-sm sm:w-56" @update:model-value="v => set(i, { note: String(v) })" />
      </li>
    </ul>
    <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">The store had no dogs listed when this was booked.</p>
  </AdminCard>
</template>
