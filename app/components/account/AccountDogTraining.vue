<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { computed } from 'vue'
import type { OwnedDog, OwnedDogRecord, RecordKind } from '~/utils/myDogs'
import { dayLabel, trainingOf } from '~/utils/myDogs'

// Training log, newest first, as a timeline. A session opens to change; "Add" logs a new one.
const props = defineProps<{ dog: OwnedDog }>()
const emit = defineEmits<{ add: [kind: RecordKind], open: [record: OwnedDogRecord] }>()
const sessions = computed(() => trainingOf(props.dog))
</script>

<template>
  <SectionPanel title="Training log" :meta="sessions.length ? `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}` : undefined">
    <template #actions>
      <Button variant="outline" size="sm" class="ml-auto" @click="emit('add', 'training')"><Plus aria-hidden="true" />Add</Button>
    </template>
    <ol v-if="sessions.length" class="m-0 flex list-none flex-col p-3">
      <li v-for="(t, i) in sessions" :key="t.id" class="relative flex gap-4 pb-5 last:pb-0">
        <span class="relative flex w-3 shrink-0 justify-center" aria-hidden="true">
          <span :class="['z-10 mt-1.5 size-3 rounded-full ring-[3px] ring-surface', i === 0 ? 'bg-marigold' : 'bg-ash']" />
          <span v-if="i < sessions.length - 1" class="absolute top-3 -bottom-5 w-px bg-line-strong" />
        </span>
        <button type="button" class="flex min-w-0 cursor-pointer flex-col gap-0.5 border-0 bg-transparent p-0 text-left text-ink" @click="emit('open', t)">
          <span class="font-mono text-[11px] font-semibold tracking-[.08em] text-ink-muted uppercase">{{ dayLabel(t.doneOn ?? t.dueOn) }}<template v-if="t.byWhom"> · {{ t.byWhom }}</template></span>
          <strong class="text-[15px] leading-5">{{ t.title }}</strong>
          <span v-if="t.note" class="text-[13px] leading-[19px] text-ink-muted">{{ t.note }}</span>
        </button>
      </li>
    </ol>
    <div v-else class="flex flex-col items-start gap-2 p-3 text-sm text-ink-muted">
      Keep a log of training sessions and refreshers: what was worked on, by whom, and how it went.
      <Button variant="outline" size="sm" @click="emit('add', 'training')"><Plus aria-hidden="true" />Log a session</Button>
    </div>
  </SectionPanel>
</template>
