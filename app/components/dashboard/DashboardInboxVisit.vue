<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Visit, VisitStatus } from '~/composables/useVisits'

// A visit request in the store inbox: the request, a note for the buyer, and the decision.
// Requested → confirm or decline; confirmed → mark done once it's happened (or decline if it can't).
const props = defineProps<{ visit: Visit, decide: (status: VisitStatus, note: string) => Promise<void> }>()

const note = ref('')
const busy = ref<VisitStatus>()
watch(() => props.visit.id, () => { note.value = props.visit.storeNote ?? '' }, { immediate: true })

async function decide(status: VisitStatus) {
  busy.value = status
  await props.decide(status, note.value)
  busy.value = undefined
}
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <VisitCard :visit="props.visit" side="store" bare />
    <template v-if="props.visit.status === 'requested' || props.visit.status === 'confirmed'">
      <div class="flex flex-col gap-1.5">
        <label :for="`visit-note-${props.visit.id}`" class="text-sm font-semibold">Note for {{ props.visit.buyerName }} <span class="font-normal text-ink-muted">(optional)</span></label>
        <Textarea :id="`visit-note-${props.visit.id}`" v-model="note" rows="2" maxlength="500" placeholder="Directions, what to bring, or another time that works" class="border-line-strong" />
      </div>
      <div class="flex flex-wrap gap-2">
        <template v-if="props.visit.status === 'requested'">
          <Button variant="marigold" size="sm" :loading="busy === 'confirmed'" :disabled="!!busy" @click="decide('confirmed')">Confirm visit</Button>
          <Button variant="outline" size="sm" :loading="busy === 'declined'" :disabled="!!busy" @click="decide('declined')">Decline</Button>
        </template>
        <template v-else>
          <Button variant="marigold" size="sm" :loading="busy === 'done'" :disabled="!!busy" @click="decide('done')">Mark as done</Button>
          <Button variant="outline" size="sm" :loading="busy === 'declined'" :disabled="!!busy" @click="decide('declined')">Can't make it</Button>
        </template>
      </div>
      <p class="m-0 text-xs leading-[18px] text-ink-muted">{{ props.visit.buyerName }} sees your decision and note in their visits. To suggest another time, decline with a note, or message them.</p>
    </template>
  </div>
</template>
