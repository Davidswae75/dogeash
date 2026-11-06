<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { StaffMember } from '~/composables/useAdminInspections'
import { inspectionDayOptions } from '~/utils/storeApplication'
import { inspectionTimes } from '~/utils/inspections'
import { visitDay } from '~/utils/time'

// Book an inspection for a store: a day (the owner's preferred days first), a time and an inspector, with an
// optional note for the inspector. `book` returns an error, or null to close.
const props = defineProps<{ storeName: string, preferredDays: string[], staff: StaffMember[], book: (day: string, time: string, inspector: string, note: string) => Promise<string | null> }>()
const open = defineModel<boolean>('open', { default: false })

const days = computed(() => {
  const preferred = props.preferredDays.filter(d => d >= new Date().toISOString().slice(0, 10)).map(d => ({ value: d, label: `${visitDay(d).label} · preferred` }))
  return [...preferred, ...inspectionDayOptions(new Date(Date.now() - 2 * 864e5)).filter(o => !preferred.some(p => p.value === o.value))]
})
const day = ref('')
const time = ref('10:00')
const inspector = ref('')
const note = ref('')
const busy = ref(false)
const error = ref('')
watch(open, (o) => {
  if (!o) return
  day.value = days.value[0]?.value ?? ''
  inspector.value = props.staff.find(s => s.role === 'inspector')?.id ?? props.staff[0]?.id ?? ''
  note.value = ''
  error.value = ''
})

async function submit() {
  if (!day.value || !inspector.value) return (error.value = 'Choose a day and an inspector.')
  busy.value = true
  error.value = (await props.book(day.value, time.value, inspector.value, note.value)) ?? ''
  busy.value = false
  if (!error.value) open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle>Book an inspection: {{ props.storeName }}</DialogTitle>
        <DialogDescription>The owner and the inspector are told at once. Call the owner first to agree the time.</DialogDescription>
      </DialogHeader>
      <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
          <FieldShell label="Day" for="inspection-day">
            <SelectMenu id="inspection-day" v-model="day" :options="days" class="h-10!" />
          </FieldShell>
          <FieldShell label="Time" for="inspection-time">
            <SelectMenu id="inspection-time" v-model="time" :options="inspectionTimes.map(t => ({ value: t, label: t }))" class="h-10! w-28" />
          </FieldShell>
        </div>
        <FieldShell label="Inspector" for="inspection-inspector" :hint="props.staff.length ? undefined : 'No staff found. Add inspectors in the SQL editor.'">
          <SelectMenu id="inspection-inspector" v-model="inspector" :options="props.staff.map(s => ({ value: s.id, label: `${s.name} · ${s.role}` }))" placeholder="Choose an inspector" class="h-10!" />
        </FieldShell>
        <FieldShell label="Note for the inspector" for="inspection-note" optional hint="Gate codes, who to ask for, what to look at.">
          <Textarea id="inspection-note" v-model="note" rows="2" maxlength="500" class="border-line-strong" />
        </FieldShell>
        <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
        <DialogFooter>
          <Button type="button" variant="ghost" :disabled="busy" @click="open = false">Cancel</Button>
          <Button type="submit" variant="marigold" :loading="busy">Book inspection</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
