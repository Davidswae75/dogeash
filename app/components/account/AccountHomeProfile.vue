<script setup lang="ts">
import { computed } from 'vue'
import { useSession } from '~/composables/useSession'
import { experienceOptions } from '~/utils/account'
import { propertyTypes } from '~/utils/protection'

// Overview panel: what you told us about your home, which is what dogs are matched against
const { user } = useSession()
const home = computed(() => user.value?.home)
const property = computed(() => propertyTypes.find(p => p.value === home.value?.property))

const rows = computed(() => home.value
  ? [
      { label: 'Protecting', value: property.value?.label ?? home.value.property },
      { label: 'City', value: home.value.city },
      { label: 'Household', value: [home.value.children ? 'Children' : 'No children', home.value.otherPets ? 'other pets' : 'no other pets'].join(', ') },
      { label: 'Experience', value: experienceOptions.find(o => o.value === home.value!.experience)?.label ?? '' },
      { label: 'Suits', value: property.value?.hint ?? '' },
    ]
  : [])
</script>

<template>
  <SectionPanel title="Home profile" meta="Used for matching" see-all="/account/profile" :see-all-label="home ? 'Edit' : 'Fill in'">
    <dl v-if="home" class="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 p-3">
      <template v-for="row in rows" :key="row.label">
        <dt class="font-mono text-[10.5px] leading-5 font-semibold tracking-[.12em] text-ink-muted uppercase">{{ row.label }}</dt>
        <dd class="m-0 text-sm leading-5 font-semibold">{{ row.value }}</dd>
      </template>
    </dl>
    <div v-else class="p-2"><AccountProfilePrompt /></div>
  </SectionPanel>
</template>
