<script setup lang="ts">
import { Film, X } from '@lucide/vue'
import { onBeforeUnmount, ref } from 'vue'
import { useRuntimeConfig } from '#imports' // nuxt
import type { DogMedia, VideoKind } from '~/utils/dogs'
import { useStoreDogs } from '~/composables/useStoreDogs'
import { DOG_VIDEOS_MAX, dogVideoUrl, videoKinds } from '~/utils/dogs'

// Up to 4 videos, each saying what it shows (obedience, protection work …) with a short title.
// Choose what it shows first, then the file; it uploads straight away. The form saves the list (`v-model:videos`).
const videos = defineModel<DogMedia['videos']>('videos', { default: () => [] })
const { uploadVideo } = useStoreDogs()
const storageUrl = useRuntimeConfig().public.supabase.url as string

const local = ref<Record<string, string>>({})
const urlOf = (path: string) => local.value[path] ?? dogVideoUrl(path, storageUrl)
onBeforeUnmount(() => Object.values(local.value).forEach(u => URL.revokeObjectURL(u)))

// Pick the kind before the file; the first one not used yet is suggested
const nextKind = (): VideoKind => (['obedience', 'protection', 'temperament', 'health', 'other'] as VideoKind[]).find(k => !videos.value.some(v => v.kind === k)) ?? 'other'
const kind = ref<VideoKind>(nextKind())
const kindOptions = (Object.keys(videoKinds) as VideoKind[]).map(k => ({ value: k, label: videoKinds[k] }))
const busy = ref(false)
const error = ref('')
const input = ref<HTMLInputElement>()

async function pick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (input.value) input.value.value = ''
  if (!file) return
  error.value = ''
  busy.value = true
  const result = await uploadVideo(file)
  busy.value = false
  if (result.error) return (error.value = result.error)
  local.value = { ...local.value, [result.path!]: URL.createObjectURL(file) }
  videos.value = [...videos.value, { path: result.path!, kind: kind.value, title: videoKinds[kind.value] }]
  kind.value = nextKind()
}
const update = (i: number, patch: Partial<DogMedia['videos'][number]>) => { videos.value = videos.value.map((v, j) => (j === i ? { ...v, ...patch } : v)) }
const remove = (i: number) => { videos.value = videos.value.filter((_, j) => j !== i) }
</script>

<template>
  <FieldShell :label="`Videos (${videos.length} of ${DOG_VIDEOS_MAX})`" optional hint="Buyers trust what they can see: heelwork, a recall, protection work on a decoy, the dog with children. MP4, WebM or MOV, up to 50 MB each; under a minute works best." :error="error">
    <ul v-if="videos.length" class="m-0 flex list-none flex-col gap-3 p-0">
      <li v-for="(v, i) in videos" :key="v.path" class="flex flex-col gap-3 rounded-lg bg-surface-sunk p-3 ring-1 ring-line sm:flex-row">
        <video :src="urlOf(v.path)" controls preload="metadata" class="aspect-video w-full rounded-md bg-night sm:w-56" />
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <div class="flex items-center gap-2">
            <SelectMenu :model-value="v.kind" :options="kindOptions" :aria-label="`What video ${i + 1} shows`" class="w-fit" @update:model-value="k => update(i, { kind: k as VideoKind })" />
            <Button type="button" variant="ghost" size="icon" class="ml-auto" :aria-label="`Remove video ${i + 1}`" @click="remove(i)"><X aria-hidden="true" /></Button>
          </div>
          <Input :model-value="v.title" maxlength="60" :aria-label="`Title of video ${i + 1}`" placeholder="Heelwork and recall" class="h-9 border-line-strong" @update:model-value="t => update(i, { title: String(t) })" />
        </div>
      </li>
    </ul>
    <div v-if="videos.length < DOG_VIDEOS_MAX" class="flex flex-wrap items-center gap-2">
      <SelectMenu v-model="kind" :options="kindOptions" aria-label="What the next video shows" class="w-fit" />
      <Button type="button" variant="outline" size="sm" :loading="busy" @click="input?.click()"><Film aria-hidden="true" />{{ busy ? 'Uploading…' : 'Add a video' }}</Button>
      <input ref="input" type="file" accept="video/mp4,video/webm,video/quicktime" class="sr-only" aria-label="Choose a video" @change="pick">
    </div>
  </FieldShell>
</template>
