<script setup lang="ts">
import { Info, X } from '@lucide/vue'
import type { Dog } from '~/utils/dogs'
import { computed } from 'vue'
import { useNotify } from '~/composables/useNotify'
import { useShortlist } from '~/composables/useShortlist'
import { COMPARE_MAX } from '~/utils/compare'
import { dogeashId, formatNaira } from '~/utils/dogs'

// One shortlisted dog: its photo, who it is, its level and price, compare and remove. A dog another buyer has
// put a deposit on says so, and asks whether to keep it here (it comes back if their sale falls through).
// Sold dogs leave every shortlist by themselves.
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
const removeIt = () => notify.shortlistRemoved(props.dog, remove(props.dog.fileNo))
</script>

<template>
  <li class="flex flex-col gap-4 p-4 sm:p-5 lg:px-6">
    <div class="grid grid-cols-[80px_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3 sm:grid-cols-[104px_minmax(0,1fr)_auto] lg:grid-cols-[120px_minmax(0,1fr)_auto_auto] lg:items-center lg:gap-x-8">
      <NuxtLink :to="link" class="row-span-2 lg:row-span-1">
        <img v-if="props.dog.photo" :src="props.dog.photo" :alt="`${props.dog.name}, ${props.dog.breed}`" class="aspect-square w-full rounded-lg object-cover">
      </NuxtLink>

      <!-- Who it is: name and status, then the facts on their own lines, then the level -->
      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <NuxtLink :to="link" class="font-display text-xl leading-6 font-extrabold text-ink no-underline font-stretch-expanded hover:underline">{{ props.dog.name }}</NuxtLink>
          <span :class="['inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold', reserved ? 'bg-ash-soft text-ink-muted' : 'bg-marigold-soft text-ink']">
            <span :class="['size-1.5 rounded-full', reserved ? 'bg-ash' : 'bg-marigold']" aria-hidden="true" />{{ reserved ? 'Reserved' : 'Available' }}
          </span>
        </div>
        <span class="text-sm leading-5 text-ink-muted">{{ props.dog.breed }} · {{ props.dog.sex }} · {{ props.dog.age }}</span>
        <span class="font-mono text-[11.5px] tracking-[.04em] text-ink-muted">{{ dogeashId(props.dog.fileNo) }}</span>
        <ProtectionScale :level="props.dog.level" class="mt-1 max-w-[280px]" />
      </div>

      <div class="col-start-2 flex flex-wrap items-center gap-x-5 gap-y-2 lg:col-start-auto lg:flex-col lg:items-end lg:gap-3">
        <span class="font-display text-2xl leading-none font-extrabold font-stretch-expanded">{{ formatNaira(props.dog.priceNaira) }}</span>
        <label :for="compareId" :class="['flex cursor-pointer items-center gap-2 text-sm font-semibold', !selected && !canCompareMore && 'text-ink-muted']">
          <Checkbox :id="compareId" :model-value="selected" class="size-[18px] rounded-[4px] border-2 border-ink" @update:model-value="onCompare" />
          Compare
        </label>
      </div>

      <button
        type="button"
        class="col-start-3 row-start-1 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-muted hover:bg-surface-sunk hover:text-ink lg:col-start-auto lg:row-start-auto"
        :aria-label="`Remove ${props.dog.name} from your shortlist`"
        @click="removeIt"
      >
        <X class="size-[18px]" aria-hidden="true" />
      </button>
    </div>

    <!-- Another buyer has put a deposit on it: keep watching, or let it go -->
    <div v-if="reserved" class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-sunk px-3.5 py-2.5 text-[13px] leading-5">
      <Info class="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
      <span class="min-w-0 flex-1">Another buyer has put a deposit on {{ props.dog.name }}. It's held for them for 5 days; if their sale falls through, it comes back and you'll be told. Keep it here?</span>
      <span class="flex gap-2">
        <Button size="sm" variant="ghost" class="h-8" @click="removeIt">Remove it</Button>
      </span>
    </div>
  </li>
</template>
