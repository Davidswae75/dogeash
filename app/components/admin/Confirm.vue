<script setup lang="ts">
import { ref, watch } from 'vue'

// Confirm an admin action: what it is, what will happen, and a note for whoever is affected (required when
// `reasonRequired`; `noNote` leaves it out). `run` does it with the note and returns an error, or null to close.
const props = defineProps<{
  title: string
  description: string
  confirmLabel: string
  reasonRequired?: boolean
  reasonFor?: string
  danger?: boolean
  noNote?: boolean
  run: (note: string) => Promise<string | null>
}>()
const open = defineModel<boolean>('open', { default: false })

const note = ref('')
const busy = ref(false)
const error = ref('')
watch(open, (o) => { if (o) { note.value = ''; error.value = '' } })

async function confirm() {
  if (props.reasonRequired && !note.value.trim()) return (error.value = `Give ${props.reasonFor ?? 'them'} a reason. They'll read it.`)
  busy.value = true
  error.value = (await props.run(note.value.trim())) ?? ''
  busy.value = false
  if (!error.value) open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle>{{ props.title }}</DialogTitle>
        <DialogDescription>{{ props.description }}</DialogDescription>
      </DialogHeader>
      <div v-if="!props.noNote" class="flex flex-col gap-1.5">
        <label for="admin-confirm-note" class="text-sm font-semibold">
          {{ props.reasonRequired ? `Reason for ${props.reasonFor ?? 'them'}` : `Note for ${props.reasonFor ?? 'them'}` }}
          <span class="font-normal text-ink-muted">{{ props.reasonRequired ? '(required, they\'ll read it)' : '(optional)' }}</span>
        </label>
        <Textarea id="admin-confirm-note" v-model="note" rows="3" maxlength="500" class="border-line-strong" />
      </div>
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <DialogFooter>
        <Button variant="ghost" :disabled="busy" @click="open = false">Cancel</Button>
        <Button :variant="props.danger ? 'default' : 'marigold'" :loading="busy" @click="confirm">{{ props.confirmLabel }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
