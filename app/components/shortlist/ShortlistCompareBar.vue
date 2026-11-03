<script setup lang="ts">
import { computed } from 'vue'
import { useShortlist } from '~/composables/useShortlist'
import { useShortlistRoutes } from '~/composables/useShortlistRoutes'
import { COMPARE_MAX } from '~/utils/compare'

// Floats at the bottom of the shortlist once dogs are picked to compare.
// Phones: the dogs on top, buttons on their own row below. Wider screens: one row.
const { compareDogs, toggleCompare } = useShortlist()
const { compare } = useShortlistRoutes()
const ready = computed(() => compareDogs.value.length >= 2)
</script>

<template>
  <Transition enter-active-class="transition duration-300 ease-calm" enter-from-class="translate-y-full opacity-0" leave-active-class="transition duration-200" leave-to-class="translate-y-full opacity-0">
    <div v-if="compareDogs.length" class="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] sm:px-8 sm:pb-[max(16px,env(safe-area-inset-bottom,0px))]">
      <div class="mx-auto flex max-w-[760px] flex-col gap-3 rounded-xl bg-night p-3.5 text-on-night shadow-[0_18px_40px_-16px_rgba(0,0,0,.6)] sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <div class="flex shrink-0 -space-x-2">
            <img v-for="dog in compareDogs" :key="dog.fileNo" :src="dog.photo" :alt="dog.name" class="size-10 rounded-full border-2 border-night object-cover">
          </div>
          <div class="flex min-w-0 flex-col">
            <strong class="truncate text-sm leading-5">{{ compareDogs.map(d => d.name).join(' vs ') }}</strong>
            <span class="truncate text-xs leading-[18px] text-on-night/70">{{ ready ? `Ready to compare · up to ${COMPARE_MAX}` : `Pick one more · up to ${COMPARE_MAX}` }}</span>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" class="text-on-night hover:bg-on-night/10" @click="compareDogs.forEach(d => toggleCompare(d.fileNo))">Clear</Button>
          <Button v-if="ready" as-child variant="marigold" size="sm" class="flex-1 sm:flex-none">
            <NuxtLink :to="compare">Compare {{ compareDogs.length }} dogs</NuxtLink>
          </Button>
          <Button v-else variant="marigold" size="sm" class="flex-1 sm:flex-none" disabled>Compare</Button>
        </div>
      </div>
    </div>
  </Transition>
</template>
