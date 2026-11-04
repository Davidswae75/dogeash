<script setup lang="ts">
import { ImagePlus, RefreshCw, Trash2 } from '@lucide/vue'
import { ref } from 'vue'
import type { StoreImage } from '~/composables/useStoreProfile'
import type { Store } from '~/utils/stores'
import { imageAccept } from '~/utils/imageUpload'

// The store's banner and logo, previewed the way buyers see them. Picking an image uploads and saves it
// straight away; removing goes back to the initials. `set` returns an error or null.
const props = defineProps<{ store: Store, set: (kind: StoreImage, file: File | null) => Promise<string | null> }>()

const busy = ref<StoreImage>()
const error = ref<Partial<Record<StoreImage, string>>>({})
const inputs = ref<Partial<Record<StoreImage, HTMLInputElement>>>({})

async function change(kind: StoreImage, file: File | null) {
  busy.value = kind
  error.value = { ...error.value, [kind]: (await props.set(kind, file)) ?? '' }
  busy.value = undefined
  const input = inputs.value[kind]
  if (input) input.value = ''
}
const pick = (kind: StoreImage, e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) change(kind, file)
}

const images: { kind: StoreImage, label: string, hint: string }[] = [
  { kind: 'banner', label: 'Banner', hint: 'A wide photo of your kennel, dogs or training field. Shown at the top of your store page and on store cards. At least 1600 pixels wide works best.' },
  { kind: 'logo', label: 'Logo', hint: 'A square logo or photo. Shown beside your store\'s name everywhere.' },
]
</script>

<template>
  <section class="flex flex-col gap-5 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6" aria-labelledby="store-images">
    <div class="flex flex-col gap-1">
      <h2 id="store-images" class="m-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">Banner and logo</h2>
      <p class="m-0 text-[13px] leading-5 text-ink-muted">These save as soon as you pick them. JPG, PNG or WebP, up to 5 MB. Without them, your store shows its initials.</p>
    </div>

    <div class="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <FieldShell v-for="img in images" :key="img.kind" :label="img.label" :hint="img.hint" :error="error[img.kind]">
        <div class="relative">
          <StoreBanner v-if="img.kind === 'banner'" :store="props.store" class="aspect-[16/5] rounded-lg" />
          <StoreAvatar v-else :initials="props.store.initials" :src="props.store.logo" class="size-28 rounded-2xl" />
          <span v-if="busy === img.kind" class="absolute inset-0 grid place-items-center rounded-lg bg-canvas/70"><Spinner class="size-6" /></span>
        </div>
        <div class="flex flex-wrap gap-2">
          <input :ref="el => (inputs[img.kind] = el as HTMLInputElement)" type="file" :accept="imageAccept" class="sr-only" :aria-label="`Choose a ${img.label.toLowerCase()} image`" @change="pick(img.kind, $event)">
          <Button type="button" variant="outline" size="sm" :disabled="!!busy" @click="inputs[img.kind]?.click()">
            <component :is="props.store[img.kind] ? RefreshCw : ImagePlus" aria-hidden="true" />{{ props.store[img.kind] ? `Change ${img.label.toLowerCase()}` : `Add a ${img.label.toLowerCase()}` }}
          </Button>
          <Button v-if="props.store[img.kind]" type="button" variant="ghost" size="sm" :disabled="!!busy" @click="change(img.kind, null)">
            <Trash2 aria-hidden="true" />Remove
          </Button>
        </div>
      </FieldShell>
    </div>
  </section>
</template>
