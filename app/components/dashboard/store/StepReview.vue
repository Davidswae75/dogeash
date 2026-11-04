<script setup lang="ts">
import { Check, CircleDashed } from '@lucide/vue'
import { computed } from 'vue'
import type { Store } from '~/utils/stores'
import { storeStepDone, storeSteps } from '~/utils/storeForm'
import { storeServices } from '~/utils/stores'

// Profile step: everything at a glance, each step with what's saved and a way back to edit it
const props = defineProps<{ store: Store }>()
const emit = defineEmits<{ edit: [step: number] }>()

const s = computed(() => props.store)
const summaries = computed<Record<string, string>>(() => ({
  store: `${s.value.name} · ${s.value.tagline || 'no tagline yet'} · ${[s.value.area, s.value.city, s.value.state].filter(Boolean).join(', ')}`,
  about: s.value.about ? `${s.value.about.slice(0, 140)}${s.value.about.length > 140 ? '…' : ''}` : 'Not filled in',
  owner: s.value.owner.name ? `${s.value.owner.name}${s.value.owner.title ? `, ${s.value.owner.title}` : ''}${s.value.owner.credentials.length ? ` · ${s.value.owner.credentials.length} credentials` : ''}` : 'Not filled in',
  history: s.value.history.length ? `${s.value.history.length} ${s.value.history.length === 1 ? 'moment' : 'moments'}, from ${s.value.history[0]!.year}` : 'Skipped for now',
  images: [s.value.banner ? 'Banner added' : 'No banner', s.value.logo ? 'logo added' : 'no logo'].join(', '),
}))
const services = computed(() => s.value.services.map(k => storeServices[k].label).join(', '))
</script>

<template>
  <ul class="m-0 flex list-none flex-col p-0">
    <li v-for="(step, i) in storeSteps.slice(0, -1)" :key="step.key" class="flex items-start gap-3 border-b border-line py-3.5 last:border-b-0">
      <component
        :is="storeStepDone(props.store, step.key) ? Check : CircleDashed"
        :class="['mt-0.5 size-5 shrink-0', storeStepDone(props.store, step.key) ? 'text-marigold' : 'text-ink-muted']"
        :aria-label="storeStepDone(props.store, step.key) ? 'Done' : step.optional ? 'Optional' : 'Not done'"
      />
      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong class="text-sm leading-5">{{ step.title }}<span v-if="step.optional" class="font-normal text-ink-muted"> (optional)</span></strong>
        <span class="text-[13px] leading-5 break-words text-ink-muted">{{ summaries[step.key] }}</span>
        <span v-if="step.key === 'about' && services" class="text-[13px] leading-5 text-ink-muted">Offers: {{ services }}</span>
      </span>
      <Button type="button" variant="ghost" size="sm" @click="emit('edit', i + 1)">Edit</Button>
    </li>
  </ul>
</template>
