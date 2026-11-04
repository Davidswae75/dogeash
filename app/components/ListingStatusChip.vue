<script setup lang="ts">
import type { ListingStatus } from '~/utils/k9'
import { cn } from '~/lib/utils'
import { listingStatusLabels } from '~/utils/dogs'

const props = defineProps<{ status: ListingStatus }>()
</script>

<template>
  <span :class="cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap', listingStatusLabels[props.status].tone)">
    <span :class="cn('size-1.5 rounded-full', listingStatusLabels[props.status].dot)" aria-hidden="true" />{{ listingStatusLabels[props.status].label }}
  </span>
</template>
