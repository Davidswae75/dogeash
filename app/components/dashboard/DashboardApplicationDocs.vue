<script setup lang="ts">
import { FileText, Upload } from '@lucide/vue'
import { ref } from 'vue'
import type { ApplicationRow, DocKind } from '~/utils/storeApplication'
import { docKinds } from '~/utils/storeApplication'

// The application's documents: upload or replace each one (PDF or photo), and open what's there.
// They're private: only the store's owner and Dogeash can open them. The CAC certificate isn't asked for
// when the kennel isn't registered yet.
const props = defineProps<{ app: ApplicationRow | null, locked: boolean, upload: (kind: DocKind, file: File) => Promise<string | null>, open: (path: string) => void }>()

const busy = ref<DocKind>()
const errors = ref<Partial<Record<DocKind, string>>>({})
const inputs = ref<Partial<Record<DocKind, HTMLInputElement>>>({})
async function pick(kind: DocKind, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  const input = inputs.value[kind]
  if (input) input.value = ''
  if (!file) return
  busy.value = kind
  errors.value = { ...errors.value, [kind]: (await props.upload(kind, file)) ?? '' }
  busy.value = undefined
}
const needed = (kind: DocKind) => kind === 'id' || (kind === 'cac' && (props.app?.cac_registered ?? true))
</script>

<template>
  <section id="application-documents" class="flex scroll-mt-24 flex-col rounded-xl bg-surface ring-1 ring-line" aria-labelledby="application-docs-title">
    <header class="flex flex-col gap-1 px-5 pt-4 pb-3 sm:px-6">
      <h2 id="application-docs-title" class="m-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">Documents</h2>
      <p class="m-0 text-[13px] leading-5 text-ink-muted">PDFs or clear photos, up to 10 MB each. Only you and Dogeash can open them.</p>
    </header>
    <ul class="m-0 flex list-none flex-col p-0">
      <li v-for="d in docKinds" :key="d.key" :class="['flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-5 py-3.5 sm:px-6', d.key === 'cac' && !needed('cac') && 'opacity-60']">
        <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-sunk"><FileText class="size-5 text-ink-muted" aria-hidden="true" /></span>
        <span class="flex min-w-[12rem] flex-1 flex-col leading-tight">
          <span class="text-sm font-semibold">
            {{ d.label }}
            <span v-if="needed(d.key)" class="font-normal text-ink-muted">(required)</span>
            <span v-else-if="d.key === 'cac'" class="font-normal text-ink-muted">(not needed: not registered yet)</span>
          </span>
          <span class="text-[13px] text-ink-muted">{{ props.app?.[d.column] ? 'Uploaded' : d.hint }}</span>
          <span v-if="errors[d.key]" class="text-[13px] font-semibold text-danger" role="alert">{{ errors[d.key] }}</span>
        </span>
        <span class="flex gap-2">
          <Button v-if="props.app?.[d.column]" type="button" variant="ghost" size="sm" @click="props.open(props.app![d.column]!)">Open</Button>
          <template v-if="!props.locked">
            <input :ref="el => (inputs[d.key] = el as HTMLInputElement)" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" class="sr-only" :aria-label="`Choose the ${d.label}`" @change="pick(d.key, $event)">
            <Button type="button" variant="outline" size="sm" :loading="busy === d.key" :disabled="!!busy" @click="inputs[d.key]?.click()">
              <Upload aria-hidden="true" />{{ props.app?.[d.column] ? 'Replace' : 'Upload' }}
            </Button>
          </template>
        </span>
      </li>
    </ul>
  </section>
</template>
