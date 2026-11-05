<script setup lang="ts">
import { ImagePlus, X } from '@lucide/vue'
import { ref } from 'vue'

// Photos taken on the day: private, staff only. Upload several at once; each saves to the sheet straight away.
const props = defineProps<{ photos: string[], urls: Record<string, string>, readonly?: boolean, upload: (f: File) => Promise<string | null>, remove: (path: string) => void }>()
const input = ref<HTMLInputElement>()
const busy = ref(0)
const error = ref('')
async function pick(e: Event) {
  const files = [...((e.target as HTMLInputElement).files ?? [])]
  if (input.value) input.value.value = ''
  error.value = ''
  busy.value = files.length
  for (const f of files) {
    const failed = await props.upload(f)
    busy.value--
    if (failed) error.value = `${f.name}: ${failed}`
  }
}
</script>

<template>
  <AdminCard title="Photos" :description="`${props.photos.length} · private: only Dogeash staff can see them`">
    <ul class="m-0 grid list-none grid-cols-3 gap-2 p-0 sm:grid-cols-5">
      <li v-for="p in props.photos" :key="p" class="relative aspect-4/3 overflow-hidden rounded-lg bg-surface-sunk ring-1 ring-line">
        <a v-if="props.urls[p]" :href="props.urls[p]" target="_blank" rel="noopener"><img :src="props.urls[p]" alt="Inspection photo" class="size-full object-cover"></a>
        <button v-if="!props.readonly" type="button" class="absolute top-1.5 right-1.5 grid size-7 cursor-pointer place-items-center rounded-full border-0 bg-night/80 text-on-night" aria-label="Remove photo" @click="props.remove(p)"><X class="size-4" aria-hidden="true" /></button>
      </li>
      <li v-for="n in busy" :key="`up-${n}`" class="grid aspect-4/3 place-items-center rounded-lg bg-surface-sunk ring-1 ring-line"><Spinner class="size-5" /></li>
      <li v-if="!props.readonly">
        <button type="button" class="grid aspect-4/3 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line-strong bg-transparent text-ink-muted hover:border-ink hover:text-ink" :disabled="!!busy" @click="input?.click()">
          <span class="flex flex-col items-center gap-1 text-xs font-semibold"><ImagePlus class="size-5" aria-hidden="true" />Add photos</span>
        </button>
      </li>
    </ul>
    <p v-if="error" class="m-0 mt-2 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
    <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" multiple class="sr-only" aria-label="Choose inspection photos" @change="pick">
  </AdminCard>
</template>
