<script setup lang="ts">
import type { CareStatus } from '~/utils/myDogs'
import { cn } from '~/lib/utils'

// Up to date / Due soon / Overdue, for vaccinations and reminders
const props = defineProps<{ status: CareStatus }>()
</script>

<template>
  <span :class="cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap', careStatus[props.status].tone)">
    <span :class="cn('size-1.5 rounded-full', careStatus[props.status].dot)" aria-hidden="true" />{{ careStatus[props.status].label }}
  </span>
</template>
