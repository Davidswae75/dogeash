<script setup lang="ts">
import { useLoader } from '~/composables/useLoader'

// Full-screen loader for waits with nothing else on screen showing progress (signing out, on the site and
// in the admin). Dogeash's dog traces itself in over the wordmark, with what's happening underneath.
// Shown with useLoader().run(). Reduced motion gets the still mark (DogMark handles that).
const { state } = useLoader()
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
        class="fixed inset-0 z-[60] grid place-items-center bg-canvas/90 p-6 text-ink backdrop-blur-md"
        role="status"
        aria-live="polite"
        :aria-label="state.title"
      >
        <div class="flex animate-rise flex-col items-center text-center">
          <span class="grid size-28 place-items-center rounded-full bg-surface ring-1 ring-line shadow-[0_24px_60px_-28px_rgb(0_0_0/.45)]">
            <DogMark animated class="size-[72px]" />
          </span>
          <AppLogo static :mark="false" class="mt-5 text-[26px]" />
          <span class="mt-6 h-px w-10 bg-line-strong" aria-hidden="true" />
          <strong class="mt-5 text-[15px] leading-6 font-semibold">{{ state.title }}</strong>
          <span v-if="state.text" class="mt-1 max-w-[30ch] text-[13px] leading-5 text-ink-muted">{{ state.text }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
