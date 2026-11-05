<script setup lang="ts">
import { Check, CircleDashed } from '@lucide/vue'
import { computed } from 'vue'
import type { Store } from '~/utils/stores'
import type { ApplicationRow } from '~/utils/storeApplication'
import { storeSetupNeeded } from '~/utils/storeForm'

// What the application needs before it can be sent, ticked off as it's done; each line goes where to do it
const props = defineProps<{ store: Store, dogs: number, app: ApplicationRow | null }>()

const items = computed(() => {
  const a = props.app
  return [
    { label: 'Store profile', hint: 'Tagline, about the kennel and who runs it', done: !storeSetupNeeded(props.store), to: '/dashboard/profile' },
    { label: 'At least one dog', hint: props.dogs ? `${props.dogs} added` : 'The inspector checks the dogs you list', done: props.dogs > 0, to: '/dashboard/dogs/new' },
    { label: 'Kennel address and phone', hint: 'Where the inspector goes, and who to call', done: !!a && a.address.trim().length >= 10 && a.contact_phone.trim().length >= 7, to: '#application-details' },
    { label: 'Inspection days', hint: 'Up to three days that suit you', done: !!a && a.preferred_days.length > 0, to: '#application-details' },
    { label: 'Documents', hint: 'Owner\'s ID, and the CAC certificate if registered', done: !!a?.id_doc_path && (!a.cac_registered || !!a.cac_doc_path), to: '#application-documents' },
  ]
})
const remaining = computed(() => items.value.filter(i => !i.done).length)
defineExpose({ remaining })
</script>

<template>
  <section class="flex flex-col rounded-xl bg-surface ring-1 ring-line" aria-labelledby="application-checklist">
    <header class="flex items-baseline justify-between gap-3 px-5 pt-4 pb-2">
      <h2 id="application-checklist" class="m-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">Before you send</h2>
      <span class="font-mono text-xs text-ink-muted">{{ items.length - remaining }} of {{ items.length }} done</span>
    </header>
    <ul class="m-0 flex list-none flex-col p-0">
      <li v-for="i in items" :key="i.label" class="border-t border-line first:border-t-0">
        <NuxtLink :to="i.to" class="flex items-center gap-3 px-5 py-3 text-ink no-underline hover:bg-surface-sunk">
          <component :is="i.done ? Check : CircleDashed" :class="['size-5 shrink-0', i.done ? 'text-marigold' : 'text-ink-muted']" :aria-label="i.done ? 'Done' : 'To do'" />
          <span class="flex min-w-0 flex-1 flex-col leading-tight">
            <span class="text-sm font-semibold">{{ i.label }}</span>
            <span class="text-[13px] text-ink-muted">{{ i.hint }}</span>
          </span>
          <span v-if="!i.done" class="text-[13px] font-bold underline underline-offset-4">Do this</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
