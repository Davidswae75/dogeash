<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { onMounted } from 'vue'
import { useSeoMeta } from '#imports' // nuxt
import { useOwnedDogs } from '~/composables/useOwnedDogs'

// My dogs: every dog you own, each with a record of health, training and care, and a card to add another
useSeoMeta({ title: 'My dogs · Dogeash' })
const { dogs, loaded, ensure } = useOwnedDogs()
onMounted(ensure)
</script>

<template>
  <div class="flex flex-col gap-6">
    <AccountHeading
      kicker="My dogs · up to 20"
      title="Your"
      :outline="dogs.length === 1 ? 'dog' : 'dogs'"
      text="Each dog's record in one place: vaccinations, treatments, vet visits and training, with reminders for what's due."
    />
    <p v-if="!loaded" class="m-0 text-sm text-ink-muted">Loading…</p>
    <div v-else class="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <AccountDogCard v-for="dog in dogs" :key="dog.id" :dog="dog" />
      <NuxtLink
        v-if="dogs.length < 20"
        to="/account/dogs/new"
        class="group flex min-h-[280px] flex-col items-start justify-center gap-3 rounded-xl border-2 border-dashed border-line-strong p-6 text-ink no-underline transition-colors hover:border-ink hover:bg-surface"
      >
        <span class="grid size-11 place-items-center rounded-full bg-marigold text-on-marigold transition-transform group-hover:scale-105"><Plus class="size-5" aria-hidden="true" /></span>
        <strong class="font-display text-lg leading-6 font-extrabold font-stretch-expanded">{{ dogs.length ? 'Add another dog' : 'Add your dog' }}</strong>
        <p class="m-0 text-sm leading-[22px] text-ink-muted">Bought on Dogeash or not: keep its vaccinations and training here, get reminders, and book vets and trainers from the care network.</p>
      </NuxtLink>
    </div>
  </div>
</template>
