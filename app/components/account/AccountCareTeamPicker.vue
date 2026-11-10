<script setup lang="ts">
import { Check, Plus, Search } from '@lucide/vue'
import { ref } from 'vue'
import { useProviderSearch } from '~/composables/useProviderSearch'

// Choose Dogeash care providers for a dog's care team: search by name, service or city, filter by kind, and
// add or take off each one. `selected` is the team now (provider ids); `toggle` adds or removes one and returns
// an error or null. The trigger goes in the default slot.
const props = defineProps<{ dogName: string, selected: string[], toggle: (providerId: string) => Promise<string | null> }>()

const open = ref(false)
const { query, kind, kinds, results: shown } = useProviderSearch()

const busy = ref('')
const error = ref('')
async function flip(id: string) {
  busy.value = id
  error.value = (await props.toggle(id)) ?? ''
  busy.value = ''
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child><slot /></DialogTrigger>
    <DialogContent class="max-h-[90vh] overflow-y-auto border-line bg-surface sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">{{ props.dogName }}'s care team</DialogTitle>
        <DialogDescription class="text-ink-muted">Pick the vets, trainers and groomers on Dogeash who look after {{ props.dogName }}. When you book care from {{ props.dogName }}'s page, they come first, already set to {{ props.dogName }}.</DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-3">
        <InputGroup class="h-11 border-line-strong bg-surface">
          <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput v-model="query" placeholder="Name, service or city" aria-label="Search care providers" />
        </InputGroup>
        <ToggleGroup v-model="kind" type="single" variant="chip" aria-label="Kind of care" class="flex w-auto flex-wrap justify-start gap-2">
          <ToggleGroupItem v-for="k in kinds" :key="k.value" :value="k.value" class="rounded-full!">{{ k.label }}</ToggleGroupItem>
        </ToggleGroup>
        <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
        <ul class="m-0 flex list-none flex-col divide-y divide-line rounded-lg p-0 ring-1 ring-line">
          <li v-for="p in shown" :key="p.id">
            <CareProviderRow :provider="p">
              <Button
                :variant="props.selected.includes(p.id) ? 'default' : 'outline'"
                size="sm"
                :loading="busy === p.id"
                :aria-pressed="props.selected.includes(p.id)"
                @click="flip(p.id)"
              >
                <component :is="props.selected.includes(p.id) ? Check : Plus" aria-hidden="true" />{{ props.selected.includes(p.id) ? 'On the team' : 'Add' }}
              </Button>
            </CareProviderRow>
          </li>
          <li v-if="!shown.length" class="p-4 text-sm text-ink-muted">No providers match. Try another word or kind of care.</li>
        </ul>
      </div>
      <DialogFooter>
        <DialogClose as-child><Button variant="marigold" class="w-full sm:w-auto">Done</Button></DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
