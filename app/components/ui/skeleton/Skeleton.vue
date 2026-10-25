<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  class?: HTMLAttributes["class"]
}

const props = defineProps<SkeletonProps>()
</script>

<template>
  <div
    data-slot="skeleton"
    :class="cn('rounded-sm bg-[linear-gradient(90deg,var(--surface-sunk)_25%,var(--ash-soft)_50%,var(--surface-sunk)_75%)] bg-size-[200%_100%] animate-shimmer', props.class)"
  />
</template>
