<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { computed } from 'vue'
import type { OwnedDog, OwnedDogRecord, RecordKind } from '~/utils/myDogs'
import { dayLabel, healthOf, recordKinds, statusOf } from '~/utils/myDogs'

// Vaccinations, treatments and vet visits: when given, when next due, and whether that's on time.
// A row opens it to change; "Add" starts a new one.
const props = defineProps<{ dog: OwnedDog }>()
const emit = defineEmits<{ add: [kind: RecordKind], open: [record: OwnedDogRecord] }>()
const rows = computed(() => healthOf(props.dog))
const attention = computed(() => rows.value.filter(r => statusOf(r.dueOn) !== 'up-to-date').length)
</script>

<template>
  <SectionPanel title="Health" :meta="!rows.length ? undefined : attention ? `${attention} need attention` : 'All up to date'">
    <template #actions>
      <Button variant="outline" size="sm" class="ml-auto" @click="emit('add', 'vaccination')"><Plus aria-hidden="true" />Add</Button>
    </template>
    <div v-if="rows.length" class="relative overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="text-left font-mono text-[10.5px] tracking-[.12em] text-ink-muted uppercase">
            <th class="px-3 py-2 font-semibold">What</th>
            <th class="px-3 py-2 font-semibold">Given</th>
            <th class="px-3 py-2 font-semibold">Next due</th>
            <th class="px-3 py-2 font-semibold"><span class="sr-only">Status</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" class="cursor-pointer border-t border-line hover:bg-surface-sunk/60" tabindex="0" @click="emit('open', r)" @keydown.enter="emit('open', r)">
            <td class="px-3 py-3">
              <span class="flex flex-col">
                <span class="font-semibold">{{ r.title }}</span>
                <span class="font-mono text-[10.5px] text-ink-muted uppercase">{{ recordKinds[r.kind].label }}<template v-if="r.byWhom"> · {{ r.byWhom }}</template></span>
              </span>
            </td>
            <td class="px-3 py-3 whitespace-nowrap text-ink-muted">{{ dayLabel(r.doneOn) }}</td>
            <td class="px-3 py-3 whitespace-nowrap">{{ dayLabel(r.dueOn) }}</td>
            <td class="px-3 py-3 text-right"><AccountCareChip v-if="r.dueOn" :status="statusOf(r.dueOn)" /></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="flex flex-col items-start gap-2 p-3 text-sm text-ink-muted">
      Log vaccinations, deworming, tick and flea treatments and vet visits, with when they're next due. We'll show what's coming up.
      <Button variant="outline" size="sm" @click="emit('add', 'vaccination')"><Plus aria-hidden="true" />Add the first one</Button>
    </div>
  </SectionPanel>
</template>
