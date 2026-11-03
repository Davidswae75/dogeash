<script setup lang="ts">
import { computed } from 'vue'
import { useColorMode } from '#imports'
import { useLoader } from '~/composables/useLoader'

// Full-screen loader: a blurred backdrop and the kennel-watch dog keeping an eye out, for waits
// with nothing else on screen showing progress (signing out). Shown with useLoader().run().
// Reduced motion gets the still of the dog (KennelWatch handles that).
const { state } = useLoader()
const colorMode = useColorMode()
const variant = computed(() => (colorMode.value === 'dark' ? 'night' : 'day'))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-calm"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200 ease-calm"
      leave-to-class="opacity-0"
    >
      <div
        v-if="state"
        class="fixed inset-0 z-50 grid place-items-center bg-canvas/75 p-6 backdrop-blur-md"
        role="status"
        aria-live="polite"
        :aria-label="state.title"
      >
        <div class="flex w-full max-w-[320px] animate-rise flex-col items-center gap-4 rounded-xl bg-surface p-5 text-center shadow-[0_24px_60px_-24px_rgb(0_0_0/.5)] ring-1 ring-line">
          <div class="w-full overflow-hidden rounded-lg">
            <KennelWatch :variant="variant" />
          </div>
          <div class="flex flex-col gap-1">
            <strong class="font-display text-lg leading-6 font-extrabold font-stretch-expanded">{{ state.title }}</strong>
            <span v-if="state.text" class="text-[13px] leading-5 text-ink-muted">{{ state.text }}</span>
          </div>
          <!-- Three paw-step dots, so there's movement even when the GIF is a still -->
          <span class="flex gap-1.5" aria-hidden="true">
            <span v-for="i in 3" :key="i" class="size-1.5 animate-pulse rounded-full bg-marigold" :style="{ animationDelay: `${(i - 1) * 180}ms` }" />
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
