<script setup lang="ts">
import type { ProtectionLevel } from '~/utils/protection'
import { cn } from '~/lib/utils'

// Five bars; levels 4 and 5 light up marigold
const props = withDefaults(defineProps<{ level: ProtectionLevel, showLabel?: boolean }>(), { showLabel: true })
const name = computed(() => protectionLevels[props.level].name)
</script>

<template>
  <div class="flex flex-col gap-1.5" role="img" :aria-label="`Protection level ${props.level} of 5: ${name}`">
    <div v-if="props.showLabel" class="text-xs leading-4 font-bold">Level {{ props.level }} · {{ name }}</div>
    <div class="flex gap-1">
      <i
        v-for="n in 5"
        :key="n"
        :class="cn('h-2 flex-1 rounded-[2px] bg-line', n <= props.level && (n >= 4 ? 'bg-marigold' : 'bg-action'))"
      />
    </div>
  </div>
</template>
