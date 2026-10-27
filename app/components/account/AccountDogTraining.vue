<script setup lang="ts">
import type { OwnedDog } from '~/utils/myDogs'

// Training log, newest first, as a timeline
const props = defineProps<{ dog: OwnedDog }>()
</script>

<template>
  <AccountPanel title="Training log" :meta="`${props.dog.training.length} sessions`">
    <ol class="m-0 flex list-none flex-col p-3">
      <li v-for="(t, i) in props.dog.training" :key="t.title" class="relative flex gap-4 pb-5 last:pb-0">
        <span class="relative flex w-3 shrink-0 justify-center" aria-hidden="true">
          <span :class="['z-10 mt-1.5 size-3 rounded-full ring-[3px] ring-surface', i === 0 ? 'bg-marigold' : 'bg-ash']" />
          <span v-if="i < props.dog.training.length - 1" class="absolute top-3 -bottom-5 w-px bg-line-strong" />
        </span>
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="font-mono text-[11px] font-semibold tracking-[.08em] text-ink-muted uppercase">{{ t.date }} · {{ t.by }}</span>
          <strong class="text-[15px] leading-5">{{ t.title }}</strong>
          <p class="m-0 text-[13px] leading-[19px] text-ink-muted">{{ t.note }}</p>
        </div>
      </li>
    </ol>
  </AccountPanel>
</template>
