<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useAdminAudit } from '~/composables/useAdminAudit'
import type { AuditEntry } from '~/utils/admin'
import type { CsvColumn } from '~/utils/csv'
import { auditKinds, auditLabel } from '~/utils/admin'

// Admin › Audit log: every admin action, newest first: who, what, on what, when, and the details
// (from and to, the note sent). Filter by kind; 100 at a time. Nobody can change or delete entries.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Audit log · Dogeash admin', robots: 'noindex' })

const { entries, more, loading, load } = useAdminAudit()
const kind = ref('')
const kindModel = computed({ get: () => kind.value || 'all', set: (v: string) => { if (v) { kind.value = v === 'all' ? '' : v; load(kind.value) } } })
onMounted(() => load())
const csv: CsvColumn<AuditEntry>[] = [
  { label: 'When', value: a => a.created_at }, { label: 'Who', value: a => a.actor_name }, { label: 'Action', value: a => auditLabel(a.action) },
  { label: 'Code', value: a => a.action }, { label: 'On', value: a => a.target_type }, { label: 'ID', value: a => a.target_id },
  { label: 'Details', value: a => JSON.stringify(a.detail) },
]
</script>

<template>
  <AdminPage title="Audit log" description="Every admin action, newest first. Entries can't be changed or deleted, by anyone.">
    <template #actions>
      <AdminExport name="audit-log" :rows="entries" :columns="csv" />
      <ToggleGroup v-model="kindModel" type="single" variant="outline" size="sm" aria-label="Show actions" class="max-w-full flex-wrap justify-start">
        <ToggleGroupItem value="all" class="px-2.5 text-xs">All</ToggleGroupItem>
        <ToggleGroupItem v-for="k in auditKinds" :key="k.prefix" :value="k.prefix" class="px-2.5 text-xs">{{ k.label }}</ToggleGroupItem>
      </ToggleGroup>
    </template>

    <AdminCard flush>
      <AdminAuditList :entries="entries" :loading="loading && !entries.length" empty="Nothing yet. Admin actions appear here as they happen." />
      <div v-if="more" class="border-t border-line px-5 py-3">
        <Button variant="outline" size="sm" :loading="loading" @click="load(kind, true)">Load older</Button>
      </div>
    </AdminCard>
  </AdminPage>
</template>
