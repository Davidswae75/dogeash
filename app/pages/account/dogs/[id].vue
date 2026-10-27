<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

// One dog's record: who it is, health and treatments, reminders, guarantee and training
const route = useRoute()
const dog = findOwnedDog(String(route.params.id))
if (!dog) throw createError({ statusCode: 404, statusMessage: 'No dog with that file number in your account' })

useSeoMeta({ title: `${dog.name} · My dogs · Dogeash` })
</script>

<template>
  <div v-if="dog" class="flex flex-col gap-5">
    <NuxtLink to="/account/dogs" class="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink">
      <ArrowLeft class="size-4" aria-hidden="true" />My dogs
    </NuxtLink>
    <AccountDogHeader :dog="dog" />
    <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div class="flex min-w-0 flex-col gap-4 sm:gap-5">
        <AccountDogHealth :dog="dog" />
        <AccountDogTraining :dog="dog" />
      </div>
      <AccountDogCare :dog="dog" />
    </div>
  </div>
</template>
