<script setup lang="ts">
import { definePageMeta, navigateTo, useSeoMeta } from '#imports' // nuxt
import type { DogMedia } from '~/utils/dogs'
import { dogeashId } from '~/utils/dogs'
import type { DogFormValues } from '~/utils/dogForm'
import { useNotify } from '~/composables/useNotify'
import { useStoreContext } from '~/composables/useStoreContext'
import { useStoreDogs } from '~/composables/useStoreDogs'

// Add a dog: the form, then back to the list with the new file number
definePageMeta({ layout: 'dashboard', title: 'Add a dog', middleware: 'store-member' })
useSeoMeta({ title: 'Add a dog · Store dashboard · Dogeash', robots: 'noindex' })

const { store } = useStoreContext()
const storeDogs = useStoreDogs()
const notify = useNotify()

async function save(values: DogFormValues, media: DogMedia, publish: boolean) {
  const { fileNo, error } = await storeDogs.create(values, media, publish)
  if (!fileNo) return error ?? null
  const held = publish && !error && storeDogs.lastStatus.value === 'pending_review'
  notify.dogUpdated(`${values.name} ${held ? 'is with Dogeash for review' : publish && !error ? 'is live' : 'saved as a draft'}`, `Dogeash ID ${dogeashId(fileNo)}.${error ? ` ${error}` : held ? ' Dogeash checks some new listings before buyers see them.' : ''}`)
  await navigateTo('/dashboard/dogs')
  return null
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[760px] flex-col gap-5">
    <p class="m-0 text-[15px] leading-6 text-ink-muted">Fill in what buyers read on the dog's page. Dogeash gives it a file number when you save.</p>
    <DashboardDogForm :verified="storeDogs.verified.value" :city="store.city" :save="save" />
  </div>
</template>
