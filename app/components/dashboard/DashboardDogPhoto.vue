<script setup lang="ts">
import { ImagePlus, RefreshCw } from '@lucide/vue'
import { ref } from 'vue'
import { useStoreDogs } from '~/composables/useStoreDogs'

// The dog's main photo: pick one and it uploads straight away; the form saves its path.
// `path` is the storage path to save; `preview` what to show (an existing photo, or the new upload).
const props = defineProps<{ preview?: string }>()
const path = defineModel<string | null>('path', { default: null })
const { uploadPhoto } = useStoreDogs()

const shown = ref(props.preview)
const busy = ref(false)
const error = ref('')
const input = ref<HTMLInputElement>()

async function pick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  busy.value = true
  error.value = ''
  const result = await uploadPhoto(file)
  busy.value = false
  if (input.value) input.value.value = ''
  if (result.error) return (error.value = result.error)
  if (shown.value?.startsWith('blob:')) URL.revokeObjectURL(shown.value)
  shown.value = URL.createObjectURL(file)
  path.value = result.path!
}
</script>

<template>
  <FieldShell label="Main photo" hint="A clear side-on photo in daylight. JPG, PNG or WebP, up to 5 MB." :error="error">
    <div class="flex items-center gap-4">
      <div class="relative grid aspect-[4/3] w-40 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-sunk ring-1 ring-line">
        <img v-if="shown" :src="shown" alt="" class="size-full object-cover">
        <ImagePlus v-else class="size-7 text-ink-muted" aria-hidden="true" />
        <span v-if="busy" class="absolute inset-0 grid place-items-center bg-canvas/70"><Spinner class="size-6" /></span>
      </div>
      <div class="flex flex-col gap-2">
        <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" id="dog-photo" @change="pick">
        <Button type="button" variant="outline" size="sm" :disabled="busy" @click="input?.click()">
          <component :is="shown ? RefreshCw : ImagePlus" aria-hidden="true" />{{ shown ? 'Change photo' : 'Add a photo' }}
        </Button>
        <span class="text-xs text-ink-muted">Needed before the dog can go live.</span>
      </div>
    </div>
  </FieldShell>
</template>
