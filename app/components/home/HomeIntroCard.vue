<script setup lang="ts">
import { BookOpen, Compass, X } from '@lucide/vue'

// Shown once to first-time visitors; returning visitors get the plain marketplace
const { isFirstVisit, dismiss } = useFirstVisit('home-intro')
</script>

<template>
  <ClientOnly>
    <Transition leave-active-class="transition-all duration-300 ease-calm" leave-to-class="-translate-y-2 opacity-0">
      <aside v-if="isFirstVisit" aria-label="New to Dogeash" class="relative flex flex-col gap-5 rounded-xl bg-marigold-soft p-6 sm:flex-row sm:items-center sm:p-7">
        <div class="flex flex-1 flex-col gap-1.5 pr-8">
          <strong class="font-display text-xl leading-6 font-extrabold font-stretch-expanded">New to guard dogs?</strong>
          <p class="m-0 max-w-[40em] text-[15px] leading-6">
            Dogeash lists trained guard dogs from kennels we inspect in person. Start with what you're protecting, or read what owning one really involves.
          </p>
        </div>
        <div class="flex flex-wrap gap-2.5">
          <Button as-child>
            <NuxtLink to="/guide#level"><Compass aria-hidden="true" />Which level fits my home?</NuxtLink>
          </Button>
          <Button as-child variant="outline">
            <NuxtLink to="/guide"><BookOpen aria-hidden="true" />Buyer's guide</NuxtLink>
          </Button>
        </div>
        <button type="button" class="absolute top-3 right-3 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-muted hover:bg-marigold/30 hover:text-ink" aria-label="Dismiss" @click="dismiss">
          <X class="size-5" aria-hidden="true" />
        </button>
      </aside>
    </Transition>
  </ClientOnly>
</template>
