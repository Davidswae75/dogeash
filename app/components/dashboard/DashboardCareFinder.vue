<script setup lang="ts">
import { BadgeCheck, Search } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { CareProvider, CareType } from '~/utils/care'
import { careTypes, listedProviders } from '~/utils/care'

// Add providers from the Dogeash care directory: search by name, narrow by type and city (the store's city first),
// then say what they do for the store. `add` returns an error or null.
const props = defineProps<{ city: string, linked: (p: CareProvider) => boolean, add: (p: CareProvider, relationship: string) => Promise<string | null>, full: boolean }>()

const query = ref('')
const type = ref<CareType | ''>('')
const cityOnly = ref(true)
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return listedProviders.value
    .filter(p => !props.linked(p))
    .filter(p => !type.value || p.type === type.value)
    .filter(p => !cityOnly.value || p.city === props.city)
    .filter(p => !q || `${p.name} ${p.person ?? ''}`.toLowerCase().includes(q))
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.rating - a.rating)
})
const typeModel = computed({ get: () => type.value, set: (v) => { type.value = (v as CareType) || '' } })

const picking = ref<CareProvider>()
const relationship = ref('')
const busy = ref(false)
const error = ref('')
function pick(p: CareProvider) {
  picking.value = p
  relationship.value = careTypes[p.type].relationship
  error.value = ''
}
async function confirm() {
  busy.value = true
  error.value = (await props.add(picking.value!, relationship.value)) ?? ''
  busy.value = false
  if (!error.value) picking.value = undefined
}
</script>

<template>
  <section class="flex flex-col gap-4 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6" aria-labelledby="care-add">
    <div class="flex flex-col gap-1">
      <h2 id="care-add" class="m-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">Add from the directory</h2>
      <p class="m-0 text-[13px] leading-5 text-ink-muted">Vets, trainers, groomers, kennel builders, equipment and boarding listed on Dogeash. Can't find someone? Ask them to contact Dogeash to be listed.</p>
    </div>

    <p v-if="props.full" class="m-0 rounded-lg bg-surface-sunk p-3 text-sm">Your care team is full (12). Remove someone to add another.</p>
    <template v-else>
      <label class="relative block">
        <span class="sr-only">Search providers</span>
        <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <Input v-model="query" type="search" placeholder="Search by name" class="h-10 border-2 border-line-strong pl-9" />
      </label>
      <ToggleGroup v-model="typeModel" type="single" variant="chip" aria-label="Type of provider" class="flex w-auto flex-wrap justify-start gap-1.5">
        <ToggleGroupItem v-for="(t, key) in careTypes" :key="key" :value="key" class="h-8 rounded-full! px-3 text-xs">{{ t.label }}</ToggleGroupItem>
      </ToggleGroup>
      <label class="flex items-center gap-2 text-sm">
        <Checkbox v-model="cityOnly" />Only in {{ props.city }}
      </label>

      <ul v-if="results.length" class="m-0 flex max-h-[420px] list-none flex-col overflow-y-auto rounded-lg p-0 ring-1 ring-line">
        <li v-for="p in results" :key="p.id" class="flex flex-col gap-2 border-b border-line px-4 py-3 last:border-b-0">
          <div class="flex items-center gap-3">
            <span class="flex min-w-0 flex-1 flex-col">
              <strong class="flex items-center gap-1.5 text-sm leading-5">{{ p.name }}<BadgeCheck v-if="p.verified" class="size-3.5 text-marigold" aria-label="Checked by Dogeash" /></strong>
              <span class="text-xs leading-[18px] text-ink-muted">{{ careTypes[p.type].label }} · {{ p.city }} · {{ p.areas }}</span>
            </span>
            <Button v-if="picking?.id !== p.id" variant="outline" size="sm" @click="pick(p)">Add</Button>
          </div>
          <form v-if="picking?.id === p.id" class="flex flex-col gap-2" @submit.prevent="confirm">
            <label :for="`care-new-${p.id}`" class="text-[13px] font-semibold">What do they do for you?</label>
            <div class="flex flex-wrap gap-2">
              <Input :id="`care-new-${p.id}`" v-model="relationship" maxlength="60" class="h-9 min-w-[12rem] flex-1 border-2 border-line-strong" />
              <Button type="submit" size="sm" variant="marigold" class="h-9" :loading="busy" :disabled="!relationship.trim()">Add to team</Button>
              <Button type="button" size="sm" variant="ghost" class="h-9" :disabled="busy" @click="picking = undefined">Cancel</Button>
            </div>
            <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
          </form>
        </li>
      </ul>
      <p v-else class="m-0 text-sm text-ink-muted">No providers match{{ cityOnly ? ` in ${props.city}` : '' }}.<template v-if="cityOnly"> Try all cities.</template></p>
    </template>
  </section>
</template>
