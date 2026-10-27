<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'

// A titled row that scrolls sideways, with arrows on wide screens and "See all".
// Each slot child is one item; give items a fixed width (e.g. w-[300px]).
const props = defineProps<{ title: string, outline?: string, subtitle?: string, seeAll?: string }>()

const track = ref<HTMLElement>()
const canPrev = ref(false)
const canNext = ref(false)

function update() {
  const el = track.value
  if (!el) return
  canPrev.value = el.scrollLeft > 4
  canNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function scroll(dir: 1 | -1) {
  track.value?.scrollBy({ left: dir * track.value.clientWidth * 0.85, behavior: 'smooth' })
}

onMounted(() => {
  update()
  window.addEventListener('resize', update)
  onBeforeUnmount(() => window.removeEventListener('resize', update))
})
</script>

<template>
  <section class="flex flex-col gap-5">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1.5">
        <h2 class="m-0 mega text-[clamp(24px,2.4vw,32px)] leading-none">
          {{ props.title }} <span v-if="props.outline" class="text-outline">{{ props.outline }}</span>
        </h2>
        <p v-if="props.subtitle" class="m-0 text-sm text-ink-muted">{{ props.subtitle }}</p>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
        <div class="hidden gap-1.5 md:flex">
          <Button variant="outline" size="icon" class="size-9 border-[1.5px] border-line-strong" :disabled="!canPrev" aria-label="Scroll left" @click="scroll(-1)">
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon" class="size-9 border-[1.5px] border-line-strong" :disabled="!canNext" aria-label="Scroll right" @click="scroll(1)">
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        <Button v-if="props.seeAll" as-child variant="ghost" size="sm">
          <NuxtLink :to="props.seeAll">See all <AppIcon name="arrow-right" :size="16" /></NuxtLink>
        </Button>
      </div>
    </div>
    <div
      ref="track"
      class="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:gap-5 sm:px-8 [&>*]:shrink-0 [&>*]:snap-start"
      @scroll.passive="update"
    >
      <slot />
    </div>
  </section>
</template>
