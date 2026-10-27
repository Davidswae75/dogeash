<script setup lang="ts">
import { Plus } from '@lucide/vue'

// My dogs: every dog you own, each with a record of health, training and care
useSeoMeta({ title: 'My dogs · Dogeash' })
const dogs = sampleOwnedDogs
</script>

<template>
  <div class="flex flex-col gap-6">
    <AccountHeading
      kicker="My dogs"
      title="Your"
      :outline="dogs.length === 1 ? 'dog' : 'dogs'"
      text="Each dog you buy on Dogeash gets a record here after handover: vaccinations, training, reminders and its health guarantee."
    />

    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <AccountDogCard v-for="dog in dogs" :key="dog.fileNo" :dog="dog" />

      <!-- Dogs bought elsewhere can be added later -->
      <div class="flex min-h-[280px] flex-col items-start justify-center gap-3 rounded-xl border-2 border-dashed border-line-strong p-6">
        <span class="grid size-11 place-items-center rounded-full bg-surface-sunk"><Plus class="size-5" aria-hidden="true" /></span>
        <strong class="font-display text-lg leading-6 font-extrabold font-stretch-expanded">Add a dog you already own</strong>
        <p class="m-0 text-sm leading-[22px] text-ink-muted">Keep its vaccinations and training here, and book vets and trainers from the care network.</p>
        <span class="rounded-full bg-surface-sunk px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-[.1em] uppercase">Soon</span>
      </div>
    </div>
  </div>
</template>
