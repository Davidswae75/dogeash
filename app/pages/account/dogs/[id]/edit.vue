<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { navigateTo, useRoute, useSeoMeta } from '#imports' // nuxt
import type { DogDraft } from '~/composables/useOwnedDogs'
import { useNotify } from '~/composables/useNotify'
import { useOwnedDogs } from '~/composables/useOwnedDogs'

// Change a dog's details and photo, then back to its record
const id = String(useRoute().params.id)
const owned = useOwnedDogs()
onMounted(owned.ensure)
const dog = computed(() => owned.find(id))
useSeoMeta({ title: () => `Edit ${dog.value?.name ?? 'dog'} · My dogs · Dogeash` })
async function save(d: DogDraft) {
  const result = await owned.save(d, id)
  if (result.error) return result.error
  useNotify().myDogUpdated('Saved', `${d.name}'s details are up to date.`)
  await navigateTo(`/account/dogs/${id}`)
  return null
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <NuxtLink :to="`/account/dogs/${id}`" class="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink"><ArrowLeft class="size-4" aria-hidden="true" />{{ dog?.name ?? 'Back' }}</NuxtLink>
    <p v-if="!owned.loaded.value" class="m-0 text-sm text-ink-muted">Loading…</p>
    <template v-else-if="dog">
      <AccountHeading kicker="My dogs" title="Edit" :outline="dog.name" />
      <AccountDogForm :key="dog.id" :dog="dog" submit-label="Save changes" :save="save">
        <template #actions>
          <Button as-child variant="ghost" class="h-11"><NuxtLink :to="`/account/dogs/${id}`">Cancel</NuxtLink></Button>
        </template>
      </AccountDogForm>
    </template>
    <p v-else class="m-0 text-sm text-ink-muted">No dog here.</p>
  </div>
</template>
