<script setup lang="ts">
import type { VisitStatus } from '~/composables/useVisits'
import { visitStatusLabels } from '~/composables/useVisits'
import { cn } from '~/lib/utils'

const props = defineProps<{ status: VisitStatus }>()
</script>

<template>
  <span :class="cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold', visitStatusLabels[props.status].tone)">
    <span :class="cn('size-1.5 rounded-full', visitStatusLabels[props.status].dot)" aria-hidden="true" />{{ visitStatusLabels[props.status].label }}
  </span>
</template>
