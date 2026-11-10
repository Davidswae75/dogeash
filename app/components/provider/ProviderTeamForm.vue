<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useNotify } from '~/composables/useNotify'
import { useProviderDashboard } from '~/composables/useProviderDashboard'
import type { CareTeamPerson } from '~/utils/care'

// Provider dashboard › Your listing › Your team: the people who work there (name, role, photo), shown on the
// provider's page as "Our team". Up to 12, in this order. Saved on its own.
const dash = useProviderDashboard()
const { listing } = dash
const people = ref<CareTeamPerson[]>([])
watch(listing, (l) => { if (l) people.value = (l.team ?? []).map(t => ({ ...t })) }, { immediate: true })

const add = () => { if (people.value.length < 12) people.value = [...people.value, { name: '', role: '', photoPath: null }] }
const remove = (i: number) => { people.value = people.value.filter((_, j) => j !== i) }

const busy = ref(false)
const error = ref('')
async function save() {
  error.value = ''
  if (people.value.some(p => !p.name.trim() && (p.role.trim() || p.photoPath))) return (error.value = 'Give everyone a name, or remove them.')
  busy.value = true
  error.value = (await dash.saveTeam(people.value)) ?? ''
  busy.value = false
  if (!error.value) useNotify().success({ kicker: 'Your listing', meta: 'Saved', title: 'Team saved', text: 'Buyers see them on your page now.' })
}
const field = 'h-11 border-line-strong bg-surface'
</script>

<template>
  <form v-if="listing" class="flex flex-col gap-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5" novalidate @submit.prevent="save">
    <div class="flex flex-col gap-1">
      <h2 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Your team</h2>
      <p class="m-0 text-[13px] leading-5 text-ink-muted">The people buyers will meet: vets, nurses, trainers, groomers. A friendly photo and their role. Up to 12.</p>
    </div>
    <ul v-if="people.length" class="m-0 flex list-none flex-col gap-4 p-0">
      <li v-for="(p, i) in people" :key="i" class="flex flex-col gap-3 rounded-lg bg-canvas/40 p-3 ring-1 ring-line sm:flex-row sm:items-center">
        <PhotoPicker v-model:path="p.photoPath" :upload="dash.uploadPhoto" :preview="p.photo" :label="`Photo of person ${i + 1}`" optional removable shape="round" class="sm:w-auto [&_label]:sr-only" />
        <div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          <Input v-model="p.name" maxlength="80" placeholder="Dr. Halima Sani" :aria-label="`Name of person ${i + 1}`" :class="field" />
          <Input v-model="p.role" maxlength="80" placeholder="Lead vet" :aria-label="`Role of person ${i + 1}`" :class="field" />
        </div>
        <Button type="button" variant="ghost" size="icon" class="size-11 self-end sm:self-center" :aria-label="`Remove person ${i + 1}`" @click="remove(i)"><Trash2 aria-hidden="true" /></Button>
      </li>
    </ul>
    <p v-else class="m-0 rounded-lg border-[1.5px] border-dashed border-line-strong p-4 text-sm text-ink-muted">No one added yet. Buyers like to see who will look after their dog.</p>
    <div class="flex flex-wrap items-center gap-3">
      <Button v-if="people.length < 12" type="button" variant="outline" size="sm" @click="add"><Plus aria-hidden="true" />Add a person</Button>
    </div>
    <p v-if="error" class="m-0 font-semibold text-danger" role="alert">{{ error }}</p>
    <div><Button type="submit" variant="marigold" class="h-11" :loading="busy">Save team</Button></div>
  </form>
</template>
