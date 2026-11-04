<script setup lang="ts">
import { ImagePlus, X } from '@lucide/vue'
import { onBeforeUnmount, ref } from 'vue'
import { useRuntimeConfig } from '#imports' // nuxt
import { useStoreDogs } from '~/composables/useStoreDogs'
import { DOG_GALLERY_MAX, dogPhotoUrl } from '~/utils/dogs'
import { imageAccept } from '~/utils/imageUpload'

// More photos after the main one, up to 8: pick several at once and each uploads straight away.
// The form saves the list of paths (`v-model:paths`); removing one here drops it when the dog is saved.
const paths = defineModel<string[]>('paths', { default: () => [] })
const { uploadPhoto } = useStoreDogs()
const storageUrl = useRuntimeConfig().public.supabase.url as string

// Photos picked in this visit show from the browser's copy until the page reloads
const local = ref<Record<string, string>>({})
const urlOf = (path: string) => local.value[path] ?? dogPhotoUrl(path, storageUrl)
onBeforeUnmount(() => Object.values(local.value).forEach(u => URL.revokeObjectURL(u)))

const busy = ref(0)
const error = ref('')
const input = ref<HTMLInputElement>()

async function pick(e: Event) {
  const files = [...((e.target as HTMLInputElement).files ?? [])].slice(0, DOG_GALLERY_MAX - paths.value.length)
  if (input.value) input.value.value = ''
  error.value = ''
  busy.value = files.length
  for (const file of files) {
    const result = await uploadPhoto(file)
    busy.value--
    if (result.error) {
      error.value = `${file.name}: ${result.error}`
      continue
    }
    local.value = { ...local.value, [result.path!]: URL.createObjectURL(file) }
    paths.value = [...paths.value, result.path!]
  }
}
const remove = (path: string) => { paths.value = paths.value.filter(p => p !== path) }
</script>

<template>
  <FieldShell :label="`More photos (${paths.length} of ${DOG_GALLERY_MAX})`" hint="Different angles, at work, with people, the kennel. JPG, PNG or WebP, up to 5 MB each. You can pick several at once." :error="error">
    <ul class="m-0 grid list-none grid-cols-3 gap-2 p-0 sm:grid-cols-4">
      <li v-for="(p, i) in paths" :key="p" class="group relative aspect-4/3 overflow-hidden rounded-lg bg-surface-sunk ring-1 ring-line">
        <img :src="urlOf(p)" :alt="`Photo ${i + 2}`" class="size-full object-cover">
        <button type="button" class="absolute top-1.5 right-1.5 grid size-7 cursor-pointer place-items-center rounded-full border-0 bg-night/80 text-on-night hover:bg-night" :aria-label="`Remove photo ${i + 2}`" @click="remove(p)">
          <X class="size-4" aria-hidden="true" />
        </button>
      </li>
      <li v-for="n in busy" :key="`up-${n}`" class="grid aspect-4/3 place-items-center rounded-lg bg-surface-sunk ring-1 ring-line"><Spinner class="size-5" /></li>
      <li v-if="paths.length + busy < DOG_GALLERY_MAX">
        <button type="button" class="grid aspect-4/3 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line-strong bg-transparent text-ink-muted hover:border-ink hover:text-ink" :disabled="!!busy" @click="input?.click()">
          <span class="flex flex-col items-center gap-1 text-xs font-semibold"><ImagePlus class="size-5" aria-hidden="true" />Add photos</span>
        </button>
      </li>
    </ul>
    <input ref="input" type="file" :accept="imageAccept" multiple class="sr-only" aria-label="Choose more photos" @change="pick">
  </FieldShell>
</template>
