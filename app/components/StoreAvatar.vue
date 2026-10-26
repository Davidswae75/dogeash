<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// Initials on charcoal until stores upload a logo
const props = defineProps<{ initials: string, class?: HTMLAttributes['class'] }>()
</script>

<template>
  <Avatar :class="cn('size-12 rounded-[14px]', props.class)">
    <AvatarFallback class="rounded-[inherit] bg-night font-display text-[17px] font-extrabold text-on-night">{{ props.initials }}</AvatarFallback>
  </Avatar>
</template>
