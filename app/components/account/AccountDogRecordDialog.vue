<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { z } from 'zod'
import type { RecordDraft } from '~/composables/useOwnedDogs'
import type { OwnedDogRecord, RecordKind } from '~/utils/myDogs'
import { recordKinds } from '~/utils/myDogs'

// Add a line to a dog's record, or change one: what it was, when it was given or happened, when it's
// next due, who did it, and a note. Opened with a kind already chosen (from "Add" on a panel) or a record.
// `save` returns an error, or null to close; `remove` the same.
const props = defineProps<{
  dogName: string
  record?: OwnedDogRecord
  kind?: RecordKind
  save: (r: RecordDraft) => Promise<string | null>
  remove?: () => Promise<string | null>
  /** A care provider adding to the record: "By" is their own name, so it isn't asked */
  hideBy?: boolean
}>()
const open = defineModel<boolean>('open', { default: false })

const kinds = Object.keys(recordKinds) as RecordKind[]
const kindOptions = kinds.map(k => ({ value: k, label: recordKinds[k].label }))
const schema = z.object({
  kind: z.enum(kinds as [RecordKind, ...RecordKind[]]),
  title: z.string().trim().min(1, 'What was it?').max(80),
  doneOn: z.string().default(''),
  dueOn: z.string().default(''),
  byWhom: z.string().trim().max(80).default(''),
  note: z.string().trim().max(500).default(''),
}).refine(v => v.doneOn || v.dueOn, { message: 'Give at least one date', path: ['dueOn'] })
type Values = z.infer<typeof schema>

const { handleSubmit, defineField, errors, resetForm } = useForm<Values>({ validationSchema: toTypedSchema(schema) })
const [kind] = defineField('kind')
const [title] = defineField('title')
const [doneOn] = defineField('doneOn')
const [dueOn] = defineField('dueOn')
const [byWhom] = defineField('byWhom')
const [note] = defineField('note')

const todayIso = () => new Date().toISOString().slice(0, 10)
watch(open, (o) => {
  if (!o) return
  error.value = ''
  const r = props.record
  const k = r?.kind ?? props.kind ?? 'vaccination'
  // A reminder starts with a due date; anything else starts as done today
  resetForm({ values: r
    ? { kind: r.kind, title: r.title, doneOn: r.doneOn ?? '', dueOn: r.dueOn ?? '', byWhom: r.byWhom, note: r.note }
    : { kind: k, title: '', doneOn: k === 'reminder' ? '' : todayIso(), dueOn: '', byWhom: '', note: '' } })
})

const meta = computed(() => recordKinds[(kind.value ?? 'vaccination') as RecordKind])
const doneLabel = computed(() => (kind.value === 'reminder' ? 'Done on' : kind.value === 'training' || kind.value === 'vet' ? 'Date' : 'Given on'))
const dueLabel = computed(() => (kind.value === 'reminder' ? 'Remind me on' : kind.value === 'vaccination' ? 'Booster due' : 'Next due'))

const busy = ref(false)
const error = ref('')
const submit = handleSubmit(async (v) => {
  busy.value = true
  error.value = (await props.save({ kind: v.kind, title: v.title, doneOn: v.doneOn || null, dueOn: v.dueOn || null, byWhom: v.byWhom, note: v.note })) ?? ''
  busy.value = false
  if (!error.value) open.value = false
})
async function del() {
  if (!props.remove) return
  busy.value = true
  error.value = (await props.remove()) ?? ''
  busy.value = false
  if (!error.value) open.value = false
}
const field = 'h-10 border-line-strong bg-surface'
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[92dvh] overflow-y-auto sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>{{ props.record ? `Change ${props.record.title}` : `Add to ${props.dogName}'s record` }}</DialogTitle>
        <DialogDescription>{{ meta.hint }} Give at least one of the two dates.</DialogDescription>
      </DialogHeader>
      <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
          <FieldShell label="Kind" for="record-kind">
            <SelectMenu id="record-kind" v-model="kind" :options="kindOptions" class="h-10!" />
          </FieldShell>
          <FieldShell label="What" for="record-title" :error="errors.title">
            <Input id="record-title" v-model="title" maxlength="80" :placeholder="meta.example" :class="field" />
          </FieldShell>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <FieldShell :label="doneLabel" for="record-done">
            <Input id="record-done" v-model="doneOn" type="date" :class="field" />
          </FieldShell>
          <FieldShell :label="dueLabel" for="record-due" :error="errors.dueOn">
            <Input id="record-due" v-model="dueOn" type="date" :class="field" />
          </FieldShell>
        </div>
        <FieldShell v-if="!props.hideBy" label="By" for="record-by" optional hint="The vet, trainer or clinic.">
          <Input id="record-by" v-model="byWhom" maxlength="80" placeholder="Kuje Veterinary Clinic" :class="field" />
        </FieldShell>
        <FieldShell label="Note" for="record-note" optional>
          <Textarea id="record-note" v-model="note" rows="2" maxlength="500" class="border-line-strong bg-surface" />
        </FieldShell>
        <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
        <DialogFooter class="flex-row flex-wrap gap-2 sm:justify-between">
          <Button v-if="props.record && props.remove" type="button" variant="ghost" class="text-danger" :disabled="busy" @click="del">Remove</Button>
          <span class="ml-auto flex gap-2">
            <DialogClose as-child><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="marigold" :loading="busy">{{ props.record ? 'Save' : 'Add' }}</Button>
          </span>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
