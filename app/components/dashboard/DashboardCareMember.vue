<script setup lang="ts">
import { BadgeCheck, MapPin } from '@lucide/vue'
import { ref } from 'vue'
import type { CareProvider } from '~/utils/care'
import { careProviderSlug, careTypes } from '~/utils/care'

// One provider on the store's care team: who they are, what they do for the store (editable), and remove.
// `rename` returns an error or null.
const props = defineProps<{ provider: CareProvider, relationship: string, manage: boolean, rename: (text: string) => Promise<string | null> }>()
const emit = defineEmits<{ remove: [] }>()

const editing = ref(false)
const text = ref('')
const busy = ref(false)
const error = ref('')
function start() {
  text.value = props.relationship
  error.value = ''
  editing.value = true
}
async function save() {
  busy.value = true
  error.value = (await props.rename(text.value)) ?? ''
  busy.value = false
  if (!error.value) editing.value = false
}
</script>

<template>
  <li class="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0">
    <div class="flex flex-wrap items-start gap-x-4 gap-y-2">
      <span class="flex min-w-[12rem] flex-1 flex-col gap-0.5">
        <NuxtLink :to="`/care/${careProviderSlug(props.provider)}`" class="flex items-center gap-1.5 text-[15px] leading-5 font-bold text-ink no-underline hover:underline">
          {{ props.provider.name }}<BadgeCheck v-if="props.provider.verified" class="size-4 text-marigold" aria-label="Checked by Dogeash" />
        </NuxtLink>
        <span class="flex flex-wrap items-center gap-x-2 text-[13px] leading-5 text-ink-muted">
          {{ careTypes[props.provider.type].label }}<template v-if="props.provider.person"> · {{ props.provider.person }}</template>
          · <MapPin class="size-3.5" aria-hidden="true" />{{ props.provider.city }}
        </span>
      </span>
      <div v-if="props.manage && !editing" class="flex gap-1">
        <Button variant="ghost" size="sm" @click="start">Edit</Button>
        <Button variant="ghost" size="sm" @click="emit('remove')">Remove</Button>
      </div>
    </div>

    <form v-if="editing" class="flex flex-col gap-2" @submit.prevent="save">
      <label :for="`care-rel-${props.provider.id}`" class="text-sm font-semibold">What they do for you</label>
      <div class="flex flex-wrap gap-2">
        <Input :id="`care-rel-${props.provider.id}`" v-model="text" maxlength="60" class="h-10 min-w-[14rem] flex-1 border-2 border-line-strong" />
        <Button type="submit" size="sm" variant="marigold" class="h-10" :loading="busy" :disabled="!text.trim()">Save</Button>
        <Button type="button" size="sm" variant="ghost" class="h-10" :disabled="busy" @click="editing = false">Cancel</Button>
      </div>
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
    </form>
    <p v-else class="m-0 w-fit rounded-full bg-marigold-soft px-3 py-1 text-[13px] font-semibold">"{{ props.relationship }}"</p>
  </li>
</template>
