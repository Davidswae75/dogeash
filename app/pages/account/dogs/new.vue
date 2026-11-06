<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { navigateTo, useSeoMeta } from '#imports' // nuxt
import type { DogDraft } from '~/composables/useOwnedDogs'
import { useNotify } from '~/composables/useNotify'
import { useOwnedDogs } from '~/composables/useOwnedDogs'

// Add a dog you own; its record opens straight after
useSeoMeta({ title: 'Add a dog · My dogs · Dogeash' })
const owned = useOwnedDogs()
async function save(d: DogDraft) {
  const result = await owned.save(d)
  if (result.error) return result.error
  useNotify().myDogUpdated(`${d.name} added`, 'Now add vaccinations and reminders to the record.')
  await navigateTo(`/account/dogs/${result.id}`)
  return null
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <NuxtLink to="/account/dogs" class="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink"><ArrowLeft class="size-4" aria-hidden="true" />My dogs</NuxtLink>
    <AccountHeading kicker="My dogs" title="Add a" outline="dog" text="Only the name is needed now. Add the rest whenever you have it to hand." />
    <AccountDogForm submit-label="Add dog" :save="save" />
  </div>
</template>
