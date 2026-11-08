<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useAdminInspections } from '~/composables/useAdminInspections'
import { useStaff } from '~/composables/useStaff'
import { inspectionStatusMeta, inspectionWhen } from '~/utils/inspections'

// Admin › Inspections: kennel visits booked and done. Admins see all of them; inspectors see their own.
// Each opens the inspection sheet. Book new ones from Applications.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Inspections · Dogeash admin', robots: 'noindex' })

const { list, loaded, load } = useAdminInspections()
const { role } = useStaff()
onMounted(load)

const tab = ref<'upcoming' | 'done'>('upcoming')
const tabModel = computed({ get: () => tab.value, set: (v: string) => { if (v) tab.value = v as 'upcoming' | 'done' } })
const upcoming = computed(() => list.value.filter(i => i.status === 'scheduled').sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for)))
const done = computed(() => list.value.filter(i => i.status !== 'scheduled'))
const shown = computed(() => (tab.value === 'upcoming' ? upcoming.value : done.value))
</script>

<template>
  <AdminPage title="Inspections" :count="upcoming.length" :description="role === 'admin' ? 'Kennel visits booked and done. Book one from Applications; passing it puts the store live.' : 'The kennel visits you\'re booked for. Open one to work through the sheet on the day.'">
    <template #actions>
      <ToggleGroup v-model="tabModel" type="single" variant="outline" size="sm" aria-label="Show inspections" class="max-w-full flex-wrap justify-start">
        <ToggleGroupItem value="upcoming" class="px-2.5 text-xs">Booked <span class="ml-1 font-mono text-ink-muted">{{ upcoming.length }}</span></ToggleGroupItem>
        <ToggleGroupItem value="done" class="px-2.5 text-xs">Done <span class="ml-1 font-mono text-ink-muted">{{ done.length }}</span></ToggleGroupItem>
      </ToggleGroup>
    </template>

    <AdminCard flush>
      <ul v-if="shown.length" class="m-0 flex list-none flex-col p-0">
        <li v-for="i in shown" :key="i.id" class="border-t border-line first:border-t-0">
          <NuxtLink :to="`/admin/inspections/${i.id}`" class="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 py-3.5 text-ink no-underline hover:bg-surface-sunk/60">
            <span class="w-[150px] shrink-0 font-mono text-[12.5px] font-semibold">{{ inspectionWhen(i.scheduled_for) }}</span>
            <span class="flex min-w-[12rem] flex-1 flex-col leading-tight">
              <span class="text-[14px] font-semibold">{{ i.store_name }}</span>
              <span class="font-mono text-[11px] text-ink-muted">{{ i.store_id }} · {{ i.store_city }} · {{ i.dogs }} {{ i.dogs === 1 ? 'dog' : 'dogs' }} · {{ i.checked }} checks marked</span>
            </span>
            <span class="text-[13px] text-ink-muted">{{ i.inspector ?? 'No inspector' }}</span>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-surface-sunk px-2 py-0.5 text-xs font-medium">
              <span class="size-2 rounded-full" :style="{ background: inspectionStatusMeta[i.status].color }" aria-hidden="true" />{{ inspectionStatusMeta[i.status].label }}
            </span>
            <ChevronRight class="size-4 text-ink-muted" aria-hidden="true" />
          </NuxtLink>
        </li>
      </ul>
      <ListSkeleton v-else-if="!loaded" variant="table" :rows="5" />
      <p v-else class="m-0 px-5 py-4 text-[13px] text-ink-muted">{{ tab === 'upcoming' ? 'No inspections booked.' : 'No inspections done yet.' }}</p>
    </AdminCard>
  </AdminPage>
</template>
