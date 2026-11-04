<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

// The store's logo, or its initials on charcoal when it hasn't uploaded one
const props = defineProps<{ initials: string, src?: string, class?: HTMLAttributes['class'] }>()
</script>

<template>
  <Avatar :class="cn('size-12 rounded-[14px]', props.class)">
    <AvatarImage v-if="props.src" :src="props.src" alt="" class="object-cover" />
    <AvatarFallback class="rounded-[inherit] bg-night font-display text-[17px] font-extrabold text-on-night">{{ props.initials }}</AvatarFallback>
  </Avatar>
</template>
