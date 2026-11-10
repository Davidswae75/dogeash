<script setup lang="ts">
import { CalendarCheck, Plus, Search } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useCareTeam } from '~/composables/useCareTeam'
import { useNotify } from '~/composables/useNotify'
import { useProviderSearch } from '~/composables/useProviderSearch'
import type { OwnedDog } from '~/utils/myDogs'
import { findCareProvider } from '~/utils/care'

// "Book care" on a dog's record: the dog's care team first, then every care provider on Dogeash with what
// they offer. Book opens that provider's booking, already set to this dog (and, for the team, the owner's
// choice about the record). Anyone further down can be added to the team from here too.
const props = defineProps<{ dog: OwnedDog }>()
const open = ref(false)
const team = useCareTeam()
onMounted(team.ensure)
const members = team.teamOf(props.dog.id)
const teamRows = computed(() => members.value.map(m => ({ ...m, provider: findCareProvider(m.providerId) })).filter(r => r.provider))
const { query, kind, kinds, results } = useProviderSearch()
const others = computed(() => results.value.filter(p => !members.value.some(m => m.providerId === p.id)))

const notify = useNotify()
const adding = ref('')
async function addToTeam(providerId: string) {
  adding.value = providerId
  const error = await team.add(props.dog.id, providerId)
  adding.value = ''
  if (error) notify.failed(error)
}
const heading = 'm-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase'
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button variant="marigold"><CalendarCheck aria-hidden="true" />Book care</Button>
    </DialogTrigger>
    <DialogContent class="max-h-[90vh] overflow-y-auto border-line bg-surface sm:max-w-[640px]">
      <DialogHeader>
        <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">Book care for {{ props.dog.name }}</DialogTitle>
        <DialogDescription class="text-ink-muted">Choose who, then what and when. {{ props.dog.name }} is already set on the booking.</DialogDescription>
      </DialogHeader>

      <section v-if="teamRows.length" class="flex flex-col gap-2" aria-labelledby="book-team">
        <h3 id="book-team" :class="heading">{{ props.dog.name }}'s care team</h3>
        <ul class="m-0 flex list-none flex-col divide-y divide-line rounded-lg p-0 ring-1 ring-line">
          <li v-for="r in teamRows" :key="r.providerId">
            <CareProviderRow :provider="r.provider!" :note="r.shareRecord ? 'May add to the record' : undefined">
              <CareBookingDialog :provider="r.provider!" :dog-id="props.dog.id" :share="r.shareRecord" label="Book" variant="marigold" />
            </CareProviderRow>
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-2" aria-labelledby="book-others">
        <h3 id="book-others" :class="heading">{{ teamRows.length ? 'More care on Dogeash' : 'Care providers on Dogeash' }}</h3>
        <InputGroup class="h-11 border-line-strong bg-surface">
          <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput v-model="query" placeholder="Name, service or city" aria-label="Search care providers" />
        </InputGroup>
        <ToggleGroup v-model="kind" type="single" variant="chip" aria-label="Kind of care" class="flex w-auto flex-wrap justify-start gap-2">
          <ToggleGroupItem v-for="k in kinds" :key="k.value" :value="k.value" class="rounded-full!">{{ k.label }}</ToggleGroupItem>
        </ToggleGroup>
        <ul class="m-0 flex list-none flex-col divide-y divide-line rounded-lg p-0 ring-1 ring-line">
          <li v-for="p in others" :key="p.id">
            <CareProviderRow :provider="p">
              <CareBookingDialog :provider="p" :dog-id="props.dog.id" label="Book" />
              <Button variant="ghost" size="sm" :loading="adding === p.id" @click="addToTeam(p.id)"><Plus aria-hidden="true" />Add to team</Button>
            </CareProviderRow>
          </li>
          <li v-if="!others.length" class="p-4 text-sm text-ink-muted">No providers match. Try another word or kind of care.</li>
        </ul>
      </section>
    </DialogContent>
  </Dialog>
</template>
