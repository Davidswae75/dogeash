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
// Kinds as tabs (each loads that kind from the server), and a search over what's loaded
const kindTab = computed({ get: () => kind.value || 'all', set: (v: string) => { kind.value = v === 'all' ? '' : v; load(kind.value) } })
const tabs = [{ value: 'all', label: 'All' }, ...auditKinds.map(k => ({ value: k.prefix, label: k.label }))]
const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return entries.value.filter(a => !q || `${a.actor_name} ${auditLabel(a.action)} ${a.target_type} ${a.target_id} ${JSON.stringify(a.detail)}`.toLowerCase().includes(q))
})
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
      <AdminExport name="audit-log" :rows="shown" :columns="csv" />
    </template>

    <ListToolbar v-model:search="query" placeholder="Who, action, or what it was on" :count="shown.length" :noun="['entry', 'entries']" :filtered="!!query.trim()" @clear="query = ''">
      <template #tabs><ListTabs v-model="kindTab" :tabs="tabs" label="Show actions" /></template>
    </ListToolbar>

    <AdminCard flush>
      <AdminAuditList :entries="shown" :loading="loading && !entries.length" empty="Nothing yet. Admin actions appear here as they happen." />
      <div v-if="more" class="border-t border-line px-5 py-3">
        <Button variant="outline" size="sm" :loading="loading" @click="load(kind, true)">Load older</Button>
      </div>
    </AdminCard>
  </AdminPage>
</template>
