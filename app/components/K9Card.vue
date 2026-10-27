<script setup lang="ts">
import type { Dog } from '~/utils/dogs'

// A listing presented as a K9 file: file tab, photo with stamp, protection scale, facts, price.
// The save button sits beside the link, not inside it: a button can't live inside a link.
const props = defineProps<{ dog: Dog }>()
const reserved = computed(() => props.dog.status === 'reserved')
// Dogs from a store you work at: a "Your store" tag instead of the save heart
const { memberOf } = useSession()
const isOwn = computed(() => !!memberOf(props.dog.storeId))
</script>

<template>
  <div class="group relative flex animate-rise flex-col transition-transform duration-200 hover:-translate-y-[3px]">
    <NuxtLink
      :to="`/dogs/${props.dog.fileNo.toLowerCase()}`"
      class="flex flex-1 flex-col overflow-hidden rounded-lg border border-line bg-surface text-inherit no-underline transition-shadow duration-200 group-hover:shadow-[0_14px_30px_-18px_rgba(17,24,39,.45)]"
    >
      <K9FileTab :file-no="props.dog.fileNo" :reserved="reserved" />

      <div class="relative grid aspect-4/3 max-w-full place-items-center overflow-hidden bg-surface-sunk">
        <img
          v-if="props.dog.photo"
          :src="props.dog.photo"
          :alt="`${props.dog.name}, ${props.dog.breed}`"
          loading="lazy"
          class="absolute inset-0 size-full object-cover"
        >
        <span v-else class="font-mono text-xs leading-none font-medium tracking-[.06em] text-ink-muted uppercase">Photo · {{ props.dog.breed }}</span>
        <VerifiedStamp class="absolute right-3.5 bottom-3.5" />
        <!-- Photo reveal: a marigold bar slides up on hover or keyboard focus -->
        <span
          aria-hidden="true"
          class="absolute inset-x-0 bottom-0 z-[1] translate-y-full bg-marigold px-[18px] py-3.5 font-display text-base leading-none font-extrabold text-on-marigold font-stretch-expanded transition-transform duration-250 ease-calm group-hover:translate-y-0 group-has-[a:focus-visible]:translate-y-0"
        >Open K9 file&nbsp; →</span>
      </div>

      <div class="flex flex-col gap-3 px-[18px] pt-4 pb-[18px]">
        <div>
          <h3 class="m-0 font-display text-[22px] leading-[26px] font-extrabold font-stretch-expanded">{{ props.dog.name }}</h3>
          <p class="m-0 text-sm leading-[22px] text-ink-muted">{{ props.dog.breed }} · {{ props.dog.sex }} · {{ props.dog.city }}</p>
        </div>

        <ProtectionScale :level="props.dog.level" />

        <FactRow
          :facts="[
            { label: 'Age', value: props.dog.age },
            { label: 'Weight', value: `${props.dog.weightKg} kg` },
            { label: 'Hips', value: props.dog.hips },
          ]"
        />

        <div class="flex items-center justify-between">
          <span class="font-display text-[19px] leading-none font-extrabold [font-stretch:110%]">{{ formatNaira(props.dog.priceNaira) }}</span>
          <span class="inline-flex items-center gap-1.5 text-sm font-bold text-action">View file <AppIcon name="arrow-right" :size="16" /></span>
        </div>
      </div>
    </NuxtLink>

    <span v-if="isOwn" class="absolute top-[52px] right-3 z-[2] inline-flex items-center gap-1.5 rounded-full bg-night px-2.5 py-1 text-[11px] font-bold text-on-night shadow-[0_2px_8px_rgba(0,0,0,.18)]">
      <span class="size-1.5 rounded-full bg-marigold" aria-hidden="true" />Your store
    </span>
    <div v-else class="absolute top-[46px] right-3 z-[2]">
      <ShortlistButton :file-no="props.dog.fileNo" :name="props.dog.name" />
    </div>
  </div>
</template>
