<script setup lang="ts">
import type { OwnedDog } from '~/utils/myDogs'

// Vaccinations and treatments: when given, when due, and whether it's on time
const props = defineProps<{ dog: OwnedDog }>()
const attention = computed(() => props.dog.vaccinations.filter(v => v.status !== 'up-to-date').length)
</script>

<template>
  <SectionPanel title="Vaccinations and treatments" :meta="attention ? `${attention} need attention` : 'All up to date'">
    <!-- relative: keeps the hidden column label inside this scroller, or it widens the whole page on phones -->
    <div class="relative overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="text-left font-mono text-[10.5px] tracking-[.12em] text-ink-muted uppercase">
            <th class="px-3 py-2 font-semibold">Treatment</th>
            <th class="px-3 py-2 font-semibold">Given</th>
            <th class="px-3 py-2 font-semibold">Next due</th>
            <th class="px-3 py-2 font-semibold"><span class="sr-only">Status</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in props.dog.vaccinations" :key="v.name" class="border-t border-line">
            <td class="px-3 py-3 font-semibold whitespace-nowrap">{{ v.name }}</td>
            <td class="px-3 py-3 whitespace-nowrap text-ink-muted">{{ v.given }}</td>
            <td class="px-3 py-3 whitespace-nowrap">{{ v.due }}</td>
            <td class="px-3 py-3 text-right"><AccountCareChip :status="v.status" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </SectionPanel>
</template>
