<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { definePageMeta, useRoute, useSeoMeta } from '#imports' // nuxt
import type { DogMedia } from '~/utils/dogs'
import type { DogFormValues } from '~/utils/dogForm'
import { useNotify } from '~/composables/useNotify'
import { useStoreDogs } from '~/composables/useStoreDogs'

// Edit one of the store's dogs: its status and actions on top, the form below
definePageMeta({ layout: 'dashboard', title: 'Edit dog', middleware: 'store-member' })

const route = useRoute()
const storeDogs = useStoreDogs()
const { loaded, verified } = storeDogs
const notify = useNotify()
const dog = computed(() => storeDogs.find(String(route.params.fileNo)))
useSeoMeta({ title: () => `${dog.value?.name ?? 'Dog'} · Store dashboard · Dogeash`, robots: 'noindex' })

onMounted(() => { if (!loaded.value) storeDogs.load() })

async function save(values: DogFormValues, media: DogMedia, publish: boolean) {
  const d = dog.value!
  const error = await storeDogs.update(d, values, media)
  if (error) return error
  if (publish) {
    const failed = await storeDogs.setStatus(d.id, 'available')
    if (failed) return failed
  }
  notify.dogUpdated(publish ? `${values.name} is live` : 'Changes saved', `${d.fileNo}. ${publish || d.status === 'available' || d.status === 'reserved' ? 'Buyers see the update now.' : 'Still a draft.'}`, d.photo)
  return null
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[760px] flex-col gap-5">
    <NuxtLink to="/dashboard/dogs" class="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink">
      <ArrowLeft class="size-4" aria-hidden="true" />All dogs
    </NuxtLink>
    <template v-if="dog">
      <header class="flex flex-wrap items-center gap-3">
        <h1 class="m-0 mega text-[clamp(26px,3vw,36px)] leading-none">{{ dog.name }}</h1>
        <ListingStatusChip :status="dog.status" />
        <span class="font-mono text-xs text-ink-muted">{{ dog.fileNo }}</span>
        <span class="flex-1" />
        <DashboardDogActions :dog="dog" :verified="verified" :can-delete="false" @status="to => storeDogs.changeStatus(dog!, to)" />
      </header>
      <p v-if="dog.file?.inspected" class="m-0 rounded-lg bg-ash-soft px-3.5 py-2.5 text-sm">{{ dog.file.inspected }} · set by Dogeash</p>
      <DashboardDogForm :key="dog.id" :dog="dog" :verified="verified" :save="save" />
    </template>
    <p v-else-if="loaded" class="m-0 rounded-xl bg-surface p-8 text-center text-ink-muted ring-1 ring-line">No dog with that file number in your store.</p>
  </div>
</template>
