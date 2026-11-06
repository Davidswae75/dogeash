<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { navigateTo, useRoute, useSeoMeta } from '#imports' // nuxt
import type { RecordDraft } from '~/composables/useOwnedDogs'
import { useNotify } from '~/composables/useNotify'
import { useOwnedDogs } from '~/composables/useOwnedDogs'
import type { OwnedDogRecord, RecordKind } from '~/utils/myDogs'

// One dog's record: who it is, health (vaccinations, treatments, vet visits), training, and what's
// coming up. Every panel adds to or opens the same record dialog.
const id = String(useRoute().params.id)
const owned = useOwnedDogs()
onMounted(owned.ensure)
const dog = computed(() => owned.find(id))
useSeoMeta({ title: () => `${dog.value?.name ?? 'My dog'} · My dogs · Dogeash` })

const dialogOpen = ref(false)
const editing = ref<OwnedDogRecord>()
const startKind = ref<RecordKind>('vaccination')
function add(kind: RecordKind) {
  editing.value = undefined
  startKind.value = kind
  dialogOpen.value = true
}
function open(r: OwnedDogRecord) {
  editing.value = r
  dialogOpen.value = true
}
const saveRecord = (r: RecordDraft) => owned.saveRecord(id, r, editing.value?.id)
const removeRecord = () => owned.removeRecord(id, editing.value!.id)
async function done(r: OwnedDogRecord) {
  const error = await owned.markDone(id, r)
  if (!error) useNotify().myDogUpdated(`${r.title}: done`, 'Logged as done today.')
}

const removeOpen = ref(false)
async function removeDog() {
  const name = dog.value?.name
  const error = await owned.remove(id)
  if (error) return error
  useNotify().myDogUpdated(`${name} removed`, 'Their record has been deleted.')
  await navigateTo('/account/dogs')
  return null
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <NuxtLink to="/account/dogs" class="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink">
      <ArrowLeft class="size-4" aria-hidden="true" />My dogs
    </NuxtLink>
    <p v-if="!owned.loaded.value" class="m-0 text-sm text-ink-muted">Loading…</p>
    <div v-else-if="!dog" class="flex flex-col items-start gap-3 rounded-xl bg-surface p-6 ring-1 ring-line">
      <strong class="font-display text-xl font-extrabold font-stretch-expanded">No dog here</strong>
      <span class="text-sm text-ink-muted">It may have been removed, or it's in another account.</span>
      <Button as-child variant="outline"><NuxtLink to="/account/dogs">Back to my dogs</NuxtLink></Button>
    </div>
    <template v-else>
      <AccountDogHeader :dog="dog" @remove="removeOpen = true" />
      <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div class="flex min-w-0 flex-col gap-4 sm:gap-5">
          <AccountDogHealth :dog="dog" @add="add" @open="open" />
          <AccountDogTraining :dog="dog" @add="add" @open="open" />
        </div>
        <div class="flex min-w-0 flex-col gap-4 sm:gap-5">
          <AccountDogCare :dog="dog" @add="add" @open="open" @done="done" />
        </div>
      </div>
      <AccountDogRecordDialog v-model:open="dialogOpen" :dog-name="dog.name" :record="editing" :kind="startKind" :save="saveRecord" :remove="removeRecord" />
      <ConfirmDialog
        v-model:open="removeOpen"
        :title="`Remove ${dog.name}?`"
        description="Their whole record goes too: vaccinations, treatments, training and reminders. This can't be undone."
        confirm-label="Remove dog"
        :run="removeDog"
      />
    </template>
  </div>
</template>
