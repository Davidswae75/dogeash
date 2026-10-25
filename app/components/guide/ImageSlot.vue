<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { GuideImage } from '~/utils/guide'
import { Check, Copy, ImagePlus } from '@lucide/vue'
import { cn } from '~/lib/utils'

// Shows the photo once it's in public/guide/, otherwise a brief describing what to generate
const props = defineProps<{ image: GuideImage, class?: HTMLAttributes['class'] }>()

const copied = ref(false)
const ratioClass = computed(() => ({
  '16/9': 'aspect-video',
  '3/2': 'aspect-[3/2]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
})[props.image.ratio])

async function copyBrief() {
  const text = `${props.image.brief}\n\nStyle: ${guideImageStyle}\nAspect ratio: ${props.image.ratio.replace('/', ':')}\nSave as: public/guide/${props.image.file}`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch {
    copied.value = false
  }
}
</script>

<template>
  <figure :class="cn('m-0', props.class)">
    <img
      v-if="props.image.ready"
      :src="props.image.file"
      :alt="props.image.alt"
      loading="lazy"
      :class="cn('block w-full rounded-lg object-cover', ratioClass)"
    >
    <div
      v-else
      :class="cn('flex flex-col gap-3 rounded-lg border-2 border-dashed border-line-strong bg-surface-sunk p-5', ratioClass)"
      role="note"
      :aria-label="`Image to add: ${props.image.alt}`"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-[4px] bg-marigold px-2 py-1 text-[11px] leading-none font-bold tracking-[.08em] text-on-marigold uppercase">
          <ImagePlus class="size-3.5" aria-hidden="true" />
          Image to add
        </span>
        <span class="font-mono text-xs text-ink-muted">{{ props.image.ratio.replace('/', ':') }} · public/guide/{{ props.image.file }}</span>
      </div>
      <p class="m-0 text-sm leading-[22px] text-ink">{{ props.image.brief }}</p>
      <div class="mt-auto">
        <Button variant="outline" size="sm" type="button" @click="copyBrief">
          <component :is="copied ? Check : Copy" aria-hidden="true" />
          {{ copied ? 'Brief copied' : 'Copy brief' }}
        </Button>
      </div>
    </div>
    <figcaption v-if="props.image.ready" class="sr-only">{{ props.image.alt }}</figcaption>
  </figure>
</template>
