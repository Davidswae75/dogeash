<script setup lang="ts">
// Day watch / Night watch. "quick" flips between the two; "segmented" offers Day, Night and Auto.
// `fit` shares the available width equally, for narrow columns such as the dashboard sidebar.
const props = withDefaults(defineProps<{ variant?: 'quick' | 'segmented', fit?: boolean }>(), { variant: 'quick' })

const colorMode = useColorMode()
const isNight = computed(() => colorMode.value === 'dark')

const options = [
  { value: 'light', label: 'Day', icon: 'sun' },
  { value: 'dark', label: 'Night', icon: 'moon' },
  { value: 'system', label: 'Auto', icon: 'auto' },
] as const

const preference = computed({
  get: () => colorMode.preference,
  // ToggleGroup emits an empty value when the pressed item is clicked again; keep the current choice
  set: (value) => { if (value) colorMode.preference = value },
})

function flip() {
  colorMode.preference = isNight.value ? 'light' : 'dark'
}
</script>

<template>
  <ClientOnly>
    <button
      v-if="props.variant === 'quick'"
      type="button"
      class="inline-flex h-[38px] cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-transparent px-3 text-[13px] font-semibold text-ink hover:bg-surface-sunk"
      :aria-label="isNight ? 'Switch to day watch' : 'Switch to night watch'"
      @click="flip"
    >
      <AppIcon :name="isNight ? 'sun' : 'moon'" :size="16" />
      <span class="hidden 2xl:inline">{{ isNight ? 'Day watch' : 'Night watch' }}</span>
    </button>

    <ToggleGroup
      v-else
      v-model="preference"
      type="single"
      variant="watch"
      aria-label="Appearance"
      :class="['inline-flex gap-0.5 rounded-full bg-surface-sunk p-[3px]', props.fit ? 'w-full' : 'w-fit']"
    >
      <ToggleGroupItem v-for="option in options" :key="option.value" :value="option.value" :class="['rounded-full!', props.fit ? 'min-w-0 flex-1 gap-1 px-1 text-xs' : 'px-3']">
        <AppIcon :name="option.icon" :size="15" />
        {{ option.label }}
      </ToggleGroupItem>
    </ToggleGroup>

    <template #fallback>
      <span class="inline-block h-[38px] w-[38px] rounded-full 2xl:w-[124px] border-[1.5px] border-line" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>
