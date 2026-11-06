<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import type { OwnedDog } from '~/utils/myDogs'
import { ageOf, dayLabel, dogSummary } from '~/utils/myDogs'

// Top of a dog's record: portrait, the facts you'd need at the vet, notes, and what you can do
// (book care, change the details, remove the dog)
const props = defineProps<{ dog: OwnedDog }>()
const emit = defineEmits<{ remove: [] }>()

const facts = computed(() => [
  { label: 'Born', value: props.dog.bornOn ? `${dayLabel(props.dog.bornOn)} · ${ageOf(props.dog.bornOn)}` : '—' },
  { label: 'Weight', value: props.dog.weightKg ? `${props.dog.weightKg} kg` : '—' },
  { label: 'Microchip', value: props.dog.microchip || '—', mono: !!props.dog.microchip },
  { label: 'With you since', value: dayLabel(props.dog.gotOn) },
])
const careServices = ['Vet check', 'Vaccination', 'Deworming and tick treatment', 'Training refresher', 'Grooming']
</script>

<template>
  <section class="grid gap-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:grid-cols-[200px_minmax(0,1fr)] sm:p-5 lg:grid-cols-[240px_minmax(0,1fr)]">
    <AccountDogPortrait :name="props.dog.name" :photo="props.dog.photo" class="aspect-square w-full self-start" />

    <div class="flex min-w-0 flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <span class="font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">My dog<template v-if="props.dog.cameFrom"> · from {{ props.dog.cameFrom }}</template></span>
        <h1 class="m-0 mega text-[clamp(32px,3.6vw,48px)] leading-none">{{ props.dog.name }}</h1>
        <span v-if="dogSummary(props.dog)" class="text-[15px] text-ink-muted">{{ dogSummary(props.dog) }}</span>
      </div>
      <ProtectionScale v-if="props.dog.level" :level="props.dog.level" class="max-w-[320px]" />
      <dl class="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line 2xl:grid-cols-4">
        <div v-for="f in facts" :key="f.label" class="flex flex-col gap-1 bg-surface px-3.5 py-3">
          <dt class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ f.label }}</dt>
          <dd :class="['m-0 text-sm font-semibold', f.mono && 'font-mono text-[13px]']">{{ f.value }}</dd>
        </div>
      </dl>
      <p v-if="props.dog.notes" class="m-0 rounded-lg bg-surface-sunk px-3.5 py-3 text-[13.5px] leading-5 whitespace-pre-line">{{ props.dog.notes }}</p>
      <div class="flex flex-wrap gap-2.5">
        <BookingDialog
          :title="`Book care for ${props.dog.name}`"
          description="Vets, trainers and groomers from the care network. Choose what you need and when."
          :services="careServices"
          home-visits
          premises-label="At the provider"
          :summary="[{ label: 'Dog', value: [props.dog.name, props.dog.breed].filter(Boolean).join(' · ') }]"
          trigger-label="Book care"
          trigger-variant="marigold"
        />
        <Button as-child variant="outline"><NuxtLink :to="`/account/dogs/${props.dog.id}/edit`"><Pencil aria-hidden="true" />Edit details</NuxtLink></Button>
        <Button variant="ghost" class="text-ink-muted hover:text-danger" @click="emit('remove')"><Trash2 aria-hidden="true" />Remove</Button>
      </div>
    </div>
  </section>
</template>
