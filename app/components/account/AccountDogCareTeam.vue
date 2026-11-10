<script setup lang="ts">
import { Plus, X } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { useCareTeam } from '~/composables/useCareTeam'
import { useNotify } from '~/composables/useNotify'
import type { OwnedDog } from '~/utils/myDogs'
import { findCareProvider } from '~/utils/care'

// Side column of a dog's record: its care team (Dogeash providers the owner picked), each with whether they may
// add visits to the record, a Book button already set to this dog, and a way to take them off.
const props = defineProps<{ dog: OwnedDog }>()
const team = useCareTeam()
onMounted(team.ensure)
const members = team.teamOf(props.dog.id)
const rows = computed(() => members.value.map(m => ({ ...m, provider: findCareProvider(m.providerId) })).filter(r => r.provider))
const selected = computed(() => members.value.map(m => m.providerId))
const notify = useNotify()

const toggle = (providerId: string) => (selected.value.includes(providerId) ? team.remove(props.dog.id, providerId) : team.add(props.dog.id, providerId))
async function share(providerId: string, on: boolean) {
  const error = await team.setShare(props.dog.id, providerId, on)
  if (error) notify.failed(error)
}
async function remove(providerId: string) {
  const error = await team.remove(props.dog.id, providerId)
  if (error) notify.failed(error)
}
</script>

<template>
  <SectionPanel title="Care team" :meta="rows.length ? `${rows.length} ${rows.length === 1 ? 'provider' : 'providers'}` : undefined">
    <template #actions>
      <AccountCareTeamPicker :dog-name="props.dog.name" :selected="selected" :toggle="toggle">
        <Button variant="outline" size="sm" class="ml-auto"><Plus aria-hidden="true" />Add</Button>
      </AccountCareTeamPicker>
    </template>
    <ul v-if="rows.length" class="m-0 flex list-none flex-col divide-y divide-line p-0">
      <li v-for="r in rows" :key="r.providerId" class="flex flex-col">
        <CareProviderRow :provider="r.provider!">
          <CareBookingDialog :provider="r.provider!" :dog-id="props.dog.id" :share="r.shareRecord" label="Book" variant="marigold" />
          <Button variant="ghost" size="icon" class="size-8" :aria-label="`Take ${r.provider!.name} off ${props.dog.name}'s care team`" title="Take off the team" @click="remove(r.providerId)"><X aria-hidden="true" /></Button>
        </CareProviderRow>
        <label class="flex items-start gap-2.5 px-3 pb-3 pl-[64px] text-[13px] leading-5 text-ink-muted">
          <Switch :model-value="r.shareRecord" class="mt-0.5" @update:model-value="v => share(r.providerId, !!v)" />
          <span>May add visits to {{ props.dog.name }}'s record (vaccinations, treatments, due dates)</span>
        </label>
      </li>
    </ul>
    <p v-else class="m-0 p-3 text-sm text-ink-muted">Add {{ props.dog.name }}'s vet, trainer or groomer from Dogeash, and booking them is one tap from here.</p>
  </SectionPanel>
</template>
