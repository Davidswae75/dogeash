<script setup lang="ts">
import { ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { CareProvider } from '~/utils/care'
import { CARE_TEAM_MAX, useStoreCare } from '~/composables/useStoreCare'
import { useStoreContext } from '~/composables/useStoreContext'

// The store's care team: providers from the Dogeash directory it works with, shown on its store page
// as "Our vet", "Our handover trainer" and so on. Owners and managers add, rename and remove them.
definePageMeta({ layout: 'dashboard', title: 'Care team', middleware: 'store-member' })
useSeoMeta({ title: 'Care team · Store dashboard · Dogeash', robots: 'noindex' })

const { store, can } = useStoreContext()
const care = useStoreCare()
const { team } = care

const removing = ref<CareProvider>()
const busy = ref(false)
async function confirmRemove() {
  busy.value = true
  await care.remove(removing.value!)
  busy.value = false
  removing.value = undefined
}
</script>

<template>
  <DashboardNoAccess v-if="!can('care')" title="Care team" />
  <div v-else class="flex flex-col gap-5">
    <p class="m-0 max-w-[44em] text-[15px] leading-6 text-ink-muted">
      The vets, trainers and suppliers you work with. Buyers see them on your store page, and can book them after handover.
    </p>

    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section class="flex flex-col self-start overflow-hidden rounded-xl bg-surface ring-1 ring-line" aria-labelledby="care-team">
        <h2 id="care-team" class="m-0 border-b border-line px-5 py-3.5 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">
          Your care team <span class="font-mono text-sm font-normal text-ink-muted">{{ team.length }} of {{ CARE_TEAM_MAX }}</span>
        </h2>
        <ul v-if="team.length" class="m-0 flex list-none flex-col p-0">
          <DashboardCareMember
            v-for="m in team"
            :key="m.provider.id"
            :provider="m.provider"
            :relationship="m.relationship"
            :manage="true"
            :rename="text => care.rename(m.provider, text)"
            @remove="removing = m.provider"
          />
        </ul>
        <p v-else class="m-0 px-5 py-8 text-center text-sm leading-[21px] text-ink-muted">
          No one yet. Add your vet first: buyers look for one on every store page.
        </p>
      </section>

      <DashboardCareFinder :city="store.city" :linked="care.linked" :add="care.add" :full="team.length >= CARE_TEAM_MAX" />
    </div>

    <AlertDialog :open="!!removing" @update:open="o => !o && (removing = undefined)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {{ removing?.name }}?</AlertDialogTitle>
          <AlertDialogDescription>They stop showing on your store page. They stay in the Dogeash directory, and you can add them again.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep them</AlertDialogCancel>
          <Button :loading="busy" @click="confirmRemove">Remove</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
