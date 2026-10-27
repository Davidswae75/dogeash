<script setup lang="ts">
import { X } from '@lucide/vue'
import type { Dog } from '~/utils/dogs'

// One shortlisted dog: who it is, its level and price, whether it's still available, and compare/remove
const props = defineProps<{ dog: Dog }>()
const { comparing, canCompareMore, toggleCompare, remove } = useShortlist()
const notify = useNotify()

const selected = computed(() => comparing(props.dog.fileNo))
const reserved = computed(() => props.dog.status === 'reserved')
const link = computed(() => `/dogs/${props.dog.fileNo.toLowerCase()}`)
const compareId = computed(() => `compare-${props.dog.fileNo}`)

function onCompare() {
  if (!toggleCompare(props.dog.fileNo)) notify.compareFull(COMPARE_MAX, props.dog)
}
</script>

<template>
  <li class="grid grid-cols-[72px_1fr_auto] items-center gap-x-4 gap-y-3 p-4 sm:grid-cols-[96px_1fr_auto_auto] sm:p-5">
    <NuxtLink :to="link" class="row-span-2 sm:row-span-1">
      <img v-if="props.dog.photo" :src="props.dog.photo" :alt="`${props.dog.name}, ${props.dog.breed}`" class="aspect-square w-full rounded-md object-cover">
    </NuxtLink>

    <div class="flex min-w-0 flex-col gap-1.5">
      <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <NuxtLink :to="link" class="font-display text-lg leading-6 font-extrabold text-ink no-underline font-stretch-expanded hover:underline">{{ props.dog.name }}</NuxtLink>
        <span :class="['inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold', reserved ? 'bg-ash-soft text-ink-muted' : 'bg-marigold-soft text-ink']">
          <span :class="['size-1.5 rounded-full', reserved ? 'bg-ash' : 'bg-marigold']" aria-hidden="true" />{{ reserved ? 'Reserved by another buyer' : 'Available' }}
        </span>
      </div>
      <span class="truncate text-sm text-ink-muted">{{ props.dog.breed }} · {{ props.dog.sex }} · {{ props.dog.age }} · <span class="font-mono">{{ props.dog.fileNo }}</span></span>
      <ProtectionScale :level="props.dog.level" class="max-w-[260px]" />
    </div>

    <div class="col-start-2 flex items-center gap-4 sm:col-start-auto sm:flex-col sm:items-end sm:gap-2">
      <span class="font-display text-xl leading-none font-extrabold font-stretch-expanded">{{ formatNaira(props.dog.priceNaira) }}</span>
      <label :for="compareId" :class="['flex items-center gap-2 text-sm font-semibold', 'cursor-pointer', !selected && !canCompareMore && 'text-ink-muted']">
        <Checkbox
          :id="compareId"
          :model-value="selected"
          class="size-[18px] rounded-[4px] border-2 border-ink"
          @update:model-value="onCompare"
        />
        Compare
      </label>
    </div>

    <button
      type="button"
      class="col-start-3 row-start-1 grid size-9 cursor-pointer place-items-center self-start rounded-full border-0 bg-transparent text-ink-muted hover:bg-surface-sunk hover:text-ink sm:col-start-auto sm:row-start-auto sm:self-center"
      :aria-label="`Remove ${props.dog.name} from your shortlist`"
      @click="notify.shortlistRemoved(props.dog, remove(props.dog.fileNo))"
    >
      <X class="size-[18px]" aria-hidden="true" />
    </button>
  </li>
</template>
