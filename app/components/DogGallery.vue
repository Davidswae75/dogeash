<script setup lang="ts">
import { ChevronLeft, ChevronRight, Dog as DogIcon, Play, X } from '@lucide/vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Dog } from '~/utils/dogs'
import { videoKinds } from '~/utils/dogs'

// The top of a dog's page: the main photo large, then its videos and more photos beside it. Any tile opens
// a full-screen viewer (arrows, keyboard, thumbnails) where videos play. With no photo yet, a plain placeholder.
const props = defineProps<{ dog: Dog }>()

type Item = { kind: 'photo', url: string, label: string } | { kind: 'video', url: string, label: string }
const items = computed<Item[]>(() => [
  ...(props.dog.photo ? [{ kind: 'photo' as const, url: props.dog.photo, label: `${props.dog.name}, main photo` }] : []),
  ...(props.dog.videos ?? []).map(v => ({ kind: 'video' as const, url: v.url, label: v.title || videoKinds[v.kind] })),
  ...(props.dog.photos ?? []).map((url, i) => ({ kind: 'photo' as const, url, label: `${props.dog.name}, photo ${i + 2}` })),
])
// Beside the main photo: up to four tiles; the last says how many more there are
const side = computed(() => items.value.slice(1, 5))
const more = computed(() => Math.max(0, items.value.length - 5))

const open = ref<number>()
const current = computed(() => (open.value === undefined ? undefined : items.value[open.value]))
const step = (by: number) => { if (open.value !== undefined) open.value = (open.value + by + items.value.length) % items.value.length }
function onKey(e: KeyboardEvent) {
  if (open.value === undefined) return
  if (e.key === 'ArrowRight') step(1)
  if (e.key === 'ArrowLeft') step(-1)
}
watch(open, (o) => {
  if (o === undefined) window.removeEventListener('keydown', onKey)
  else window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
const viewerOpen = computed({ get: () => open.value !== undefined, set: (v: boolean) => { if (!v) open.value = undefined } })
</script>

<template>
  <div :class="['grid gap-3', side.length ? 'grid-cols-2 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-[210px_210px]' : 'grid-cols-1']">
    <!-- Main photo -->
    <button
      v-if="items[0]"
      type="button"
      :class="['group relative col-span-2 cursor-zoom-in overflow-hidden rounded-lg border-0 bg-surface-sunk p-0 md:col-span-1 md:row-span-2', side.length ? 'aspect-4/3 md:aspect-auto' : 'aspect-[16/9] max-h-[460px] md:col-span-1']"
      :aria-label="`Open ${items[0].label}`"
      @click="open = 0"
    >
      <img :src="items[0].url" :alt="items[0].label" class="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]">
      <VerifiedStamp class="absolute right-[18px] bottom-[18px]" />
    </button>
    <div v-else class="relative col-span-2 grid aspect-[16/9] max-h-[420px] w-full place-items-center rounded-lg bg-surface-sunk text-ink-muted md:col-span-1">
      <span class="flex flex-col items-center gap-2 text-sm"><DogIcon class="size-8" aria-hidden="true" />No photos yet</span>
      <VerifiedStamp class="absolute right-[18px] bottom-[18px]" />
    </div>

    <!-- Videos and more photos -->
    <button
      v-for="(item, i) in side"
      :key="item.url"
      type="button"
      class="group relative h-[140px] cursor-zoom-in overflow-hidden rounded-lg border-0 bg-night p-0 md:h-auto"
      :aria-label="`Open ${item.label}${i === side.length - 1 && more ? `, and ${more} more` : ''}`"
      @click="open = i + 1"
    >
      <video v-if="item.kind === 'video'" :src="`${item.url}#t=0.5`" preload="metadata" muted playsinline class="size-full object-cover opacity-80" />
      <img v-else :src="item.url" :alt="item.label" class="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]">
      <span v-if="item.kind === 'video'" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-night/30 text-on-night">
        <span class="grid size-11 place-items-center rounded-full bg-marigold text-on-marigold shadow-lg"><Play class="size-5 translate-x-px fill-current" aria-hidden="true" /></span>
        <span class="max-w-[90%] truncate font-mono text-[11px] font-semibold tracking-[.1em] uppercase">{{ item.label }}</span>
      </span>
      <span v-if="i === side.length - 1 && more" class="absolute inset-0 grid place-items-center bg-night/60 font-mono text-[15px] font-semibold text-on-night">+ {{ more }} more</span>
    </button>
  </div>

  <!-- Full-screen viewer -->
  <Dialog v-model:open="viewerOpen">
    <DialogContent class="flex h-[100dvh] max-h-none w-screen max-w-none! flex-col gap-0 rounded-none border-0 bg-night p-0 text-on-night sm:max-w-none [&>button:last-child]:hidden">
      <DialogTitle class="sr-only">{{ props.dog.name }}: photos and videos</DialogTitle>
      <header class="flex items-center justify-between gap-4 px-4 py-3">
        <span class="truncate text-sm">{{ current?.label }} <span class="ml-2 font-mono text-xs opacity-60">{{ (open ?? 0) + 1 }} / {{ items.length }}</span></span>
        <button type="button" class="grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-on-night/10 text-inherit hover:bg-on-night/20" aria-label="Close" @click="open = undefined"><X class="size-5" aria-hidden="true" /></button>
      </header>
      <div class="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
        <template v-if="current">
          <video v-if="current.kind === 'video'" :key="current.url" :src="current.url" controls autoplay playsinline class="max-h-full max-w-full rounded-md" />
          <img v-else :key="current.url" :src="current.url" :alt="current.label" class="max-h-full max-w-full rounded-md object-contain">
        </template>
        <template v-if="items.length > 1">
          <button type="button" class="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-on-night/10 text-inherit hover:bg-on-night/20 sm:left-4" aria-label="Previous" @click="step(-1)"><ChevronLeft class="size-6" aria-hidden="true" /></button>
          <button type="button" class="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-on-night/10 text-inherit hover:bg-on-night/20 sm:right-4" aria-label="Next" @click="step(1)"><ChevronRight class="size-6" aria-hidden="true" /></button>
        </template>
      </div>
      <nav v-if="items.length > 1" class="flex justify-center gap-2 overflow-x-auto px-4 py-3" aria-label="All photos and videos">
        <button
          v-for="(item, i) in items"
          :key="item.url"
          type="button"
          :class="['relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-night p-0', i === open ? 'border-marigold' : 'border-transparent opacity-60 hover:opacity-100']"
          :aria-label="`Show ${item.label}`"
          :aria-current="i === open"
          @click="open = i"
        >
          <video v-if="item.kind === 'video'" :src="`${item.url}#t=0.5`" preload="metadata" muted class="size-full object-cover" />
          <img v-else :src="item.url" alt="" class="size-full object-cover">
          <Play v-if="item.kind === 'video'" class="absolute inset-0 m-auto size-4 fill-on-night text-on-night" aria-hidden="true" />
        </button>
      </nav>
    </DialogContent>
  </Dialog>
</template>
