<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'

// The store's dogs with how each is doing: level, status, enquiries and views, filtered by status
const { store } = useStoreContext()
const dogs = computed(() => storeSummary(store.value).dogs)

const filter = ref<'all' | 'available' | 'reserved'>('all')
const filterModel = computed({
  get: () => filter.value,
  set: (v) => { if (v) filter.value = v },
})
const filters = computed(() => [
  { value: 'all', label: 'All', count: dogs.value.length },
  { value: 'available', label: 'Available', count: dogs.value.filter(d => d.status === 'available').length },
  { value: 'reserved', label: 'Reserved', count: dogs.value.filter(d => d.status === 'reserved').length },
] as const)
const shown = computed(() => filter.value === 'all' ? dogs.value : dogs.value.filter(d => d.status === filter.value))
const statsOf = (fileNo: string) => dashboardDogStats[fileNo]
</script>

<template>
  <SectionPanel title="Your dogs" see-all="/dashboard/dogs" see-all-label="Manage">
    <template #actions>
      <ToggleGroup v-model="filterModel" type="single" variant="chip" aria-label="Show dogs" class="hidden gap-1 sm:flex">
        <ToggleGroupItem v-for="f in filters" :key="f.value" :value="f.value" class="h-7 rounded-full! px-2.5 text-xs">
          {{ f.label }} <span class="font-mono opacity-70">{{ f.count }}</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[600px] border-collapse text-left text-sm">
        <thead>
          <tr class="font-mono text-[10.5px] tracking-[.12em] text-ink-muted uppercase">
            <th scope="col" class="px-3 py-2 font-semibold">Dog</th>
            <th scope="col" class="px-3 py-2 font-semibold">Level</th>
            <th scope="col" class="px-3 py-2 font-semibold">Status</th>
            <th scope="col" class="px-3 py-2 text-right font-semibold">Enquiries</th>
            <th scope="col" class="px-3 py-2 text-right font-semibold">Views</th>
            <th scope="col" class="px-3 py-2 text-right font-semibold">Price</th>
            <th scope="col" class="w-8"><span class="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dog in shown" :key="dog.fileNo" class="group border-t border-line hover:bg-surface-sunk">
            <td class="px-3 py-2.5">
              <NuxtLink :to="`/dogs/${dog.fileNo.toLowerCase()}`" class="flex items-center gap-3 text-ink no-underline">
                <img v-if="dog.photo" :src="dog.photo" alt="" class="size-10 rounded-md object-cover">
                <span>
                  <strong class="block leading-5">{{ dog.name }}</strong>
                  <span class="font-mono text-[11px] whitespace-nowrap text-ink-muted">{{ dog.fileNo }}</span>
                </span>
              </NuxtLink>
            </td>
            <td class="px-3 py-2.5">
              <span class="flex items-center gap-2">
                <span class="flex gap-0.5" aria-hidden="true">
                  <i v-for="n in 5" :key="n" :class="['h-1.5 w-2.5 rounded-[1px]', n <= dog.level ? 'bg-ink' : 'bg-line', n <= dog.level && n >= 4 && 'bg-marigold']" />
                </span>
                <span class="font-semibold">{{ dog.level }}</span>
              </span>
            </td>
            <td class="px-3 py-2.5"><StatusDot :reserved="dog.status === 'reserved'" class="text-[11px] font-semibold" /></td>
            <td class="px-3 py-2.5 text-right font-mono tabular-nums">
              <span v-if="statsOf(dog.fileNo)?.enquiries" class="font-semibold">{{ statsOf(dog.fileNo)!.enquiries }}</span>
              <span v-else class="text-ink-muted">—</span>
            </td>
            <td class="px-3 py-2.5 text-right font-mono text-ink-muted tabular-nums">{{ statsOf(dog.fileNo)?.views ?? '—' }}</td>
            <td class="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">{{ formatNaira(dog.priceNaira) }}</td>
            <td class="pr-3">
              <NuxtLink :to="`/dogs/${dog.fileNo.toLowerCase()}`" class="grid size-7 place-items-center rounded-full text-ink-muted group-hover:text-ink" :aria-label="`Open ${dog.name}`">
                <ChevronRight class="size-4" aria-hidden="true" />
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </SectionPanel>
</template>
