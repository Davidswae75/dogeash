<script setup lang="ts">
import { ArrowLeft, Plus, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import { navigateTo, useSeoMeta } from '#imports' // nuxt
import type { DogDraft } from '~/composables/useOwnedDogs'
import { useCareTeam } from '~/composables/useCareTeam'
import { useNotify } from '~/composables/useNotify'
import { useOwnedDogs } from '~/composables/useOwnedDogs'
import { findCareProvider } from '~/utils/care'

// Add a dog you own, and (optionally) its care team from Dogeash's providers; its record opens straight after
useSeoMeta({ title: 'Add a dog · My dogs · Dogeash' })
const owned = useOwnedDogs()
const team = useCareTeam()

// The care team is chosen before the dog exists, then saved with it
const picked = ref<string[]>([])
const pickedRows = computed(() => picked.value.map(id => findCareProvider(id)).filter(p => !!p))
const share = ref(true)
const toggle = async (id: string) => {
  picked.value = picked.value.includes(id) ? picked.value.filter(p => p !== id) : [...picked.value, id].slice(0, 8)
  return null
}

async function save(d: DogDraft) {
  const result = await owned.save(d)
  if (result.error) return result.error
  const failed = (await Promise.all(picked.value.map(id => team.add(result.id!, id, share.value)))).find(e => e)
  useNotify().myDogUpdated(`${d.name} added`, failed ? `${failed} Add the care team from ${d.name}'s page.` : 'Now add vaccinations and reminders to the record.')
  await navigateTo(`/account/dogs/${result.id}`)
  return null
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <NuxtLink to="/account/dogs" class="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted no-underline hover:text-ink"><ArrowLeft class="size-4" aria-hidden="true" />My dogs</NuxtLink>
    <AccountHeading kicker="My dogs" title="Add a" outline="dog" text="Only the name is needed now. Add the rest whenever you have it to hand." />
    <AccountDogForm submit-label="Add dog" :save="save">
      <template #extra>
        <section class="flex flex-col gap-4 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5" aria-labelledby="new-dog-team">
          <div class="flex flex-col gap-1">
            <h2 id="new-dog-team" class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Care team <span class="text-sm font-normal text-ink-muted">(optional)</span></h2>
            <p class="m-0 text-[13px] leading-5 text-ink-muted">The vets, trainers and groomers on Dogeash who look after this dog. Booking them from its page is then one tap, already set to this dog.</p>
          </div>
          <ul v-if="pickedRows.length" class="m-0 flex list-none flex-col divide-y divide-line rounded-lg p-0 ring-1 ring-line">
            <li v-for="p in pickedRows" :key="p!.id">
              <CareProviderRow :provider="p!">
                <Button type="button" variant="ghost" size="icon" class="size-8" :aria-label="`Take ${p!.name} off`" @click="toggle(p!.id)"><X aria-hidden="true" /></Button>
              </CareProviderRow>
            </li>
          </ul>
          <div class="flex flex-wrap items-center gap-3">
            <AccountCareTeamPicker dog-name="Your dog" :selected="picked" :toggle="toggle">
              <Button type="button" variant="outline" size="sm"><Plus aria-hidden="true" />{{ picked.length ? 'Change' : 'Choose providers' }}</Button>
            </AccountCareTeamPicker>
          </div>
          <label v-if="picked.length" class="flex items-start gap-2.5 text-sm leading-5">
            <Checkbox v-model="share" class="mt-0.5" />
            <span>Let them add visits to this dog's record <span class="text-ink-muted">(vaccinations, treatments, next due dates). They see only what they add. You can change this for each one later.</span></span>
          </label>
        </section>
      </template>
    </AccountDogForm>
  </div>
</template>
