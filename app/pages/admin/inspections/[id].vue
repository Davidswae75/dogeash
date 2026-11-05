<script setup lang="ts">
import { ArrowLeft, MapPin, Phone } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { definePageMeta, navigateTo, useRoute, useSeoMeta } from '#imports' // nuxt
import { useAdminInspections } from '~/composables/useAdminInspections'
import { useNotify } from '~/composables/useNotify'
import { useStaff } from '~/composables/useStaff'
import { checklistFor, inspectionStatusMeta, inspectionWhen } from '~/utils/inspections'

// One inspection's sheet: where and when, the checklist, the dogs, photos and a summary. Saved as you go;
// then the result. Passed: the store goes live, with this inspection on its record and its dogs marked
// inspected. Failed: the store goes back to its owner with the summary. Finished sheets are read-only.
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Inspection · Dogeash admin', robots: 'noindex' })

const route = useRoute()
const id = String(route.params.id)
const inspections = useAdminInspections()
const { sheet, photoUrls } = inspections
const { role } = useStaff()
const error = ref('')

const dirty = ref(false)
onMounted(async () => {
  error.value = (await inspections.open(id)) ?? ''
  if (sheet.value && sheet.value.status === 'scheduled') sheet.value.checklist = checklistFor(sheet.value.checklist)
  dirty.value = false
})
watch(() => [sheet.value?.checklist, sheet.value?.dogs, sheet.value?.summary], () => { dirty.value = true }, { deep: true })

const finished = computed(() => !!sheet.value && sheet.value.status !== 'scheduled')
const allMarked = computed(() => !!sheet.value && sheet.value.checklist.length > 0 && sheet.value.checklist.every(c => c.ok !== null))
const failedChecks = computed(() => sheet.value?.checklist.filter(c => c.ok === false).length ?? 0)

const saving = ref(false)
async function save() {
  saving.value = true
  error.value = (await inspections.save()) ?? ''
  saving.value = false
  if (!error.value) {
    dirty.value = false
    useNotify().adminDone('Sheet saved', 'Pick up where you left off any time.')
  }
}

// Recording the result, and cancelling (admins), go through the shared confirm
const confirm = ref<'pass' | 'fail' | 'cancel'>()
const confirmOpen = ref(false)
function ask(kind: 'pass' | 'fail' | 'cancel') {
  confirm.value = kind
  confirmOpen.value = true
}
async function run(note: string) {
  const s = sheet.value!
  if (confirm.value === 'cancel') {
    const failed = await inspections.cancel(s.id, note)
    if (!failed) await navigateTo('/admin/inspections')
    return failed
  }
  const failed = await inspections.complete(confirm.value === 'pass')
  if (!failed) useNotify().adminDone(confirm.value === 'pass' ? `${s.store_name} passed` : `${s.store_name} didn't pass`, confirm.value === 'pass' ? 'The store is live; its record and dogs are updated. The owner has been told.' : 'The store is back with its owner, with your summary.')
  return failed
}
const confirmText = computed(() => ({
  pass: { title: `Record a pass for ${sheet.value?.store_name}?`, description: `The store goes live at once. Its public record shows this inspection and the ${sheet.value?.checklist.filter(c => c.ok).length} checks passed; the dogs you saw are marked inspected, with the levels you confirmed.`, label: 'Record pass' },
  fail: { title: `Record a fail for ${sheet.value?.store_name}?`, description: 'The store goes back to its owner as a draft, and your summary is the reason they read. They can fix things and apply again.', label: 'Record fail' },
  cancel: { title: 'Cancel this inspection?', description: 'The owner is told, with your reason. You can book another from Applications.', label: 'Cancel inspection' },
}[confirm.value ?? 'pass']))
</script>

<template>
  <div class="flex flex-col gap-5">
    <NuxtLink to="/admin/inspections" class="inline-flex w-fit items-center gap-1.5 text-sm text-ink-muted no-underline hover:text-ink"><ArrowLeft class="size-4" aria-hidden="true" />Inspections</NuxtLink>
    <p v-if="error && !sheet" class="m-0 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger ring-1 ring-danger/30" role="alert">{{ error }}</p>
    <p v-else-if="!sheet" class="m-0 text-sm text-ink-muted">Loading…</p>

    <template v-if="sheet">
      <AdminPage :title="sheet.store_name" :description="`${sheet.store_public_id} · ${sheet.store_city} · ${inspectionWhen(sheet.scheduled_for)} · inspector: ${sheet.inspector ?? '—'}`">
        <template #actions>
          <span class="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-medium ring-1 ring-line">
            <span class="size-2 rounded-full" :style="{ background: inspectionStatusMeta[sheet.status].color }" aria-hidden="true" />{{ inspectionStatusMeta[sheet.status].label }}
          </span>
          <Button v-if="!finished && role === 'admin'" variant="ghost" size="sm" @click="ask('cancel')">Cancel inspection</Button>
        </template>

        <!-- Where to go -->
        <AdminCard>
          <div class="flex flex-wrap gap-x-8 gap-y-3 pt-4 text-[13.5px]">
            <span class="flex gap-2"><MapPin class="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" /><span class="flex flex-col leading-snug"><span>{{ sheet.address || 'No address given' }}</span><span v-if="sheet.directions" class="text-ink-muted">{{ sheet.directions }}</span></span></span>
            <a v-if="sheet.contact_phone" :href="`tel:${sheet.contact_phone}`" class="flex items-center gap-2 text-ink"><Phone class="size-4 text-ink-muted" aria-hidden="true" />{{ sheet.contact_phone }}</a>
            <span v-if="sheet.note" class="rounded-lg bg-surface-sunk px-3 py-1.5">Note: {{ sheet.note }}</span>
          </div>
        </AdminCard>

        <AdminInspectionChecklist v-model="sheet.checklist" :readonly="finished" />
        <AdminInspectionDogs v-model="sheet.dogs" :photos="sheet.dog_photos" :readonly="finished" />
        <AdminInspectionPhotos :photos="sheet.photos" :urls="photoUrls" :readonly="finished" :upload="inspections.uploadPhoto" :remove="inspections.removePhoto" />

        <AdminCard title="Summary" description="Your verdict in a few sentences. On a fail, the store reads this as the reason.">
          <Textarea v-model="sheet.summary" :disabled="finished" rows="4" maxlength="2000" placeholder="What you found, and what (if anything) needs fixing" class="border-line-strong" />
        </AdminCard>

        <div v-if="!finished" class="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-1 py-3 backdrop-blur">
          <p v-if="error" class="m-0 w-full text-sm font-semibold text-danger" role="alert">{{ error }}</p>
          <Button variant="outline" :loading="saving" :disabled="!dirty" @click="save">Save progress</Button>
          <span class="text-[13px] text-ink-muted">{{ allMarked ? (failedChecks ? `${failedChecks} ${failedChecks === 1 ? 'check' : 'checks'} failed.` : 'Every check passed.') : 'Mark every check to record the result.' }}</span>
          <span class="flex-1" />
          <Button variant="outline" :disabled="!allMarked" @click="ask('fail')">Record fail</Button>
          <Button variant="marigold" :disabled="!allMarked" @click="ask('pass')">Record pass</Button>
        </div>
        <p v-else class="m-0 text-sm text-ink-muted">Finished {{ sheet.completed_at ? inspectionWhen(sheet.completed_at) : '' }}. This sheet is now read-only.</p>
      </AdminPage>

      <AdminConfirm
        v-model:open="confirmOpen"
        :title="confirmText.title"
        :description="confirmText.description"
        :confirm-label="confirmText.label"
        :reason-required="confirm === 'cancel'"
        reason-for="the store"
        :no-note="confirm !== 'cancel'"
        :danger="confirm !== 'pass'"
        :run="run"
      />
    </template>
  </div>
</template>
