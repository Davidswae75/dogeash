<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useAdminAudit } from '~/composables/useAdminAudit'
import { initialsOf } from '~/utils/account'
import { adminTime, auditKinds, auditLabel } from '~/utils/admin'

// Admin › Audit log: every admin action, newest first: who, what, on what, when, and the details
// (from and to, the note sent). Filter by kind; 100 at a time. Nobody can change or delete entries.
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Audit log · Dogeash admin', robots: 'noindex' })

const { entries, more, loading, load } = useAdminAudit()
const kind = ref('')
const kindModel = computed({ get: () => kind.value || 'all', set: (v: string) => { if (v) { kind.value = v === 'all' ? '' : v; load(kind.value) } } })
onMounted(() => load())

// The details worth reading: the status before and after, and the note
const detailLine = (d: Record<string, unknown>) => [
  d.from && d.to ? `${String(d.from).replace('_', ' ')} → ${String(d.to).replace('_', ' ')}` : '',
  d.name ? String(d.name) : '',
  d.store ? `store ${d.store}` : '',
].filter(Boolean).join(' · ')
</script>

<template>
  <AdminPage title="Audit log" description="Every admin action, newest first. Entries can't be changed or deleted, by anyone.">
    <template #actions>
      <ToggleGroup v-model="kindModel" type="single" variant="outline" size="sm" aria-label="Show actions">
        <ToggleGroupItem value="all" class="px-2.5 text-xs">All</ToggleGroupItem>
        <ToggleGroupItem v-for="k in auditKinds" :key="k.prefix" :value="k.prefix" class="px-2.5 text-xs">{{ k.label }}</ToggleGroupItem>
      </ToggleGroup>
    </template>

    <AdminCard flush>
      <ol v-if="entries.length" class="m-0 flex list-none flex-col p-0">
        <li v-for="a in entries" :key="a.id" class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-line px-5 py-3 first:border-t-0 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <span class="row-span-2 mt-0.5 grid size-8 place-items-center rounded-full bg-surface-sunk text-[11px] font-bold">{{ initialsOf(a.actor_name || '?') }}</span>
          <span class="text-[13.5px]">
            <strong class="font-semibold">{{ auditLabel(a.action) }}</strong>
            <span class="font-mono text-[12px] text-ink-muted"> · {{ a.target_type }} {{ a.target_id.length > 20 ? `${a.target_id.slice(0, 8)}…` : a.target_id }}</span>
          </span>
          <span class="col-start-2 font-mono text-[11.5px] text-ink-muted sm:col-start-3 sm:row-start-1 sm:text-right">{{ adminTime(a.created_at) }}</span>
          <span class="col-start-2 flex flex-col gap-1 text-[12.5px] leading-[18px] text-ink-muted">
            <span>by {{ a.actor_name || 'someone' }}<template v-if="detailLine(a.detail)"> · {{ detailLine(a.detail) }}</template></span>
            <span v-if="a.detail.note" class="rounded-md bg-surface-sunk px-2.5 py-1.5 text-ink">"{{ a.detail.note }}"</span>
            <span v-if="a.detail.body" class="line-clamp-2 italic">Review: "{{ a.detail.body }}"</span>
          </span>
        </li>
      </ol>
      <p v-else class="m-0 px-5 py-4 text-[13px] text-ink-muted">{{ loading ? 'Loading…' : 'Nothing yet. Admin actions appear here as they happen.' }}</p>
      <div v-if="more" class="border-t border-line px-5 py-3">
        <Button variant="outline" size="sm" :loading="loading" @click="load(kind, true)">Load older</Button>
      </div>
    </AdminCard>
  </AdminPage>
</template>
