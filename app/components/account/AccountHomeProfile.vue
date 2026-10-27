<script setup lang="ts">
// Overview panel: what you told us about your home, which is what dogs are matched against
const profile = sampleBuyerProfile
const property = propertyTypes.find(p => p.value === profile.property)

const rows = [
  { label: 'Protecting', value: property?.label ?? profile.property },
  { label: 'City', value: profile.city },
  { label: 'Household', value: profile.children ? 'Children at home' : 'Adults only' },
  { label: 'Experience', value: profile.experience },
  { label: 'Suits', value: property?.hint ?? '' },
]
</script>

<template>
  <AccountPanel title="Home profile" meta="Used for matching" see-all="/account/profile" see-all-label="Edit">
    <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 p-3">
      <template v-for="row in rows" :key="row.label">
        <dt class="font-mono text-[10.5px] leading-5 font-semibold tracking-[.12em] text-ink-muted uppercase">{{ row.label }}</dt>
        <dd class="m-0 text-sm leading-5 font-semibold">{{ row.value }}</dd>
      </template>
    </dl>
  </AccountPanel>
</template>
