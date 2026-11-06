<script setup lang="ts">
import { Check, Plus } from '@lucide/vue'
import { computed } from 'vue'
import type { OwnedDog, OwnedDogRecord, RecordKind } from '~/utils/myDogs'
import { dayLabel, recordKinds, statusOf, upcomingOf } from '~/utils/myDogs'

// Side column of a dog's record: everything with a due date (boosters, treatments, reminders),
// most urgent first, each with "Done". "Add" sets a reminder.
const props = defineProps<{ dog: OwnedDog }>()
const emit = defineEmits<{ add: [kind: RecordKind], open: [record: OwnedDogRecord], done: [record: OwnedDogRecord] }>()
const due = computed(() => upcomingOf(props.dog))
</script>

<template>
  <SectionPanel title="Coming up" :meta="due.length ? `${due.length} due` : undefined">
    <template #actions>
      <Button variant="outline" size="sm" class="ml-auto" @click="emit('add', 'reminder')"><Plus aria-hidden="true" />Reminder</Button>
    </template>
    <ul v-if="due.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="r in due" :key="r.id" class="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-sunk/60">
        <button type="button" class="flex min-w-0 flex-1 cursor-pointer flex-col border-0 bg-transparent p-0 text-left text-ink" @click="emit('open', r)">
          <span class="text-sm font-semibold">{{ r.title }}</span>
          <span class="font-mono text-[11px] text-ink-muted">{{ recordKinds[r.kind].label }} · {{ dayLabel(r.dueOn) }}</span>
        </button>
        <AccountCareChip :status="statusOf(r.dueOn)" />
        <Button variant="ghost" size="icon" class="size-8" :aria-label="`Mark ${r.title} done`" title="Done" @click="emit('done', r)"><Check aria-hidden="true" /></Button>
      </li>
    </ul>
    <p v-else class="m-0 p-3 text-sm text-ink-muted">Nothing due. Add a booster date to a vaccination, or set a reminder, and it shows here.</p>
  </SectionPanel>
</template>
