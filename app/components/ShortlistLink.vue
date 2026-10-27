<script setup lang="ts">
import { Heart } from '@lucide/vue'

// Header link to the shortlist, with how many dogs are on it
const { count } = useShortlist()
</script>

<template>
  <NuxtLink
    to="/shortlist"
    class="relative grid size-[38px] place-items-center rounded-full border-[1.5px] border-line-strong text-ink no-underline hover:bg-surface-sunk [&.router-link-active]:border-ink"
    :aria-label="`Shortlist${count ? `, ${count} ${count === 1 ? 'dog' : 'dogs'}` : ''}`"
  >
    <Heart class="size-[18px]" aria-hidden="true" />
    <ClientOnly>
      <Transition enter-active-class="transition duration-200 ease-calm" enter-from-class="scale-50 opacity-0">
        <span
          v-if="count"
          :key="count"
          class="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1 text-[11px] font-bold text-on-marigold ring-2 ring-canvas"
          aria-hidden="true"
        >{{ count }}</span>
      </Transition>
    </ClientOnly>
  </NuxtLink>
</template>
