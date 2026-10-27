<script setup lang="ts">
import { ImagePlus } from '@lucide/vue'
import type { OwnedDog } from '~/utils/myDogs'

// Top of a dog's record: portrait, the facts you'd need at the vet, and booking care
const props = defineProps<{ dog: OwnedDog }>()
const store = computed(() => getStore(props.dog.storeId))

const facts = computed(() => [
  { label: 'Born', value: props.dog.born },
  { label: 'Weight', value: `${props.dog.weightKg} kg` },
  { label: 'Microchip', value: props.dog.microchip, mono: true },
  { label: 'Handed over', value: props.dog.handedOver },
])

const careServices = ['Vet check', 'Vaccination', 'Deworming and tick treatment', 'Training refresher', 'Grooming']
</script>

<template>
  <section class="grid gap-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:grid-cols-[200px_minmax(0,1fr)] sm:p-5 lg:grid-cols-[240px_minmax(0,1fr)]">
    <div class="relative self-start">
      <AccountDogPortrait :name="props.dog.name" :photo="props.dog.photo" class="aspect-square w-full" />
      <span v-if="!props.dog.photo" class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold">
        <ImagePlus class="size-3.5" aria-hidden="true" />Add a photo · soon
      </span>
    </div>

    <div class="flex min-w-0 flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <span class="font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">K9 file · {{ props.dog.fileNo }}</span>
        <h1 class="m-0 mega text-[clamp(32px,3.6vw,48px)] leading-none">{{ props.dog.name }}</h1>
        <span class="text-[15px] text-ink-muted">
          {{ props.dog.breed }} · {{ props.dog.sex }} · {{ props.dog.age }} · from
          <NuxtLink v-if="store" :to="`/stores/${store.slug}`" class="font-semibold text-ink">{{ store.name }}</NuxtLink>
        </span>
      </div>
      <ProtectionScale :level="props.dog.level" class="max-w-[320px]" />
      <dl class="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line 2xl:grid-cols-4">
        <div v-for="f in facts" :key="f.label" class="flex flex-col gap-1 bg-surface px-3.5 py-3">
          <dt class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ f.label }}</dt>
          <dd :class="['m-0 text-sm font-semibold', f.mono && 'font-mono text-[13px]']">{{ f.value }}</dd>
        </div>
      </dl>
      <div class="flex flex-wrap gap-2.5">
        <BookingDialog
          :title="`Book care for ${props.dog.name}`"
          description="Vets, trainers and groomers from the care network. Choose what you need and when."
          :services="careServices"
          home-visits
          premises-label="At the provider"
          :summary="[{ label: 'Dog', value: `${props.dog.name} · ${props.dog.fileNo}` }]"
          trigger-label="Book care"
          trigger-variant="marigold"
        />
      </div>
    </div>
  </section>
</template>
