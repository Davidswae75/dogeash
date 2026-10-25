<script setup lang="ts">
import { cn } from '~/lib/utils'
const props = defineProps<{ reserved?: boolean }>()
</script>

<template>
  <span class="inline-flex items-center gap-1.5 font-mono uppercase">
    <span :class="cn('size-2 rounded-full', props.reserved ? 'bg-ash' : 'bg-marigold')" />
    {{ props.reserved ? 'Reserved' : 'Available' }}
  </span>
</template>
