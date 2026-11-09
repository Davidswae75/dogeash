<script setup lang="ts">
import { ImagePlus, RefreshCw, X } from '@lucide/vue'
import { ref } from 'vue'
import { imageAccept } from '~/utils/imageUpload'

// One photo: pick it and it uploads straight away (`upload` returns the storage path or an error); the form
// saves its path (`v-model:path`). `preview` is the saved photo to show first; `removable` adds a Remove button.
const props = withDefaults(defineProps<{
  upload: (file: File) => Promise<{ path?: string, error?: string }>
  preview?: string
  label: string
  hint?: string
  note?: string
  optional?: boolean
  removable?: boolean
  shape?: 'wide' | 'round'
}>(), { shape: 'wide' })
const path = defineModel<string | null>('path', { default: null })

const shown = ref(props.preview)
const busy = ref(false)
const error = ref('')
const input = ref<HTMLInputElement>()

async function pick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  busy.value = true
  error.value = ''
  const result = await props.upload(file)
  busy.value = false
  if (input.value) input.value.value = ''
  if (result.error) return (error.value = result.error)
  if (shown.value?.startsWith('blob:')) URL.revokeObjectURL(shown.value)
  shown.value = URL.createObjectURL(file)
  path.value = result.path!
}
function remove() {
  shown.value = undefined
  path.value = null
}
</script>

<template>
  <FieldShell :label="props.label" :optional="props.optional" :hint="props.hint" :error="error">
    <div class="flex items-center gap-4">
      <div class="relative grid shrink-0 place-items-center overflow-hidden bg-surface-sunk ring-1 ring-line" :class="props.shape === 'round' ? 'size-24 rounded-full' : 'aspect-[4/3] w-40 rounded-lg'">
        <img v-if="shown" :src="shown" alt="" class="size-full object-cover">
        <ImagePlus v-else class="size-7 text-ink-muted" aria-hidden="true" />
        <span v-if="busy" class="absolute inset-0 grid place-items-center bg-canvas/70"><Spinner class="size-6" /></span>
      </div>
      <div class="flex flex-col items-start gap-2">
        <input ref="input" type="file" :accept="imageAccept" class="sr-only" :aria-label="`Choose ${props.label.toLowerCase()}`" @change="pick">
        <div class="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" :disabled="busy" @click="input?.click()">
            <component :is="shown ? RefreshCw : ImagePlus" aria-hidden="true" />{{ shown ? 'Change photo' : 'Add a photo' }}
          </Button>
          <Button v-if="props.removable && shown" type="button" variant="ghost" size="sm" :disabled="busy" @click="remove"><X aria-hidden="true" />Remove</Button>
        </div>
        <span v-if="props.note" class="text-xs text-ink-muted">{{ props.note }}</span>
      </div>
    </div>
  </FieldShell>
</template>
