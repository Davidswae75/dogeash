<script setup lang="ts">
import type { AuditEntry } from '~/utils/admin'
import { initialsOf } from '~/utils/account'
import { adminTime, auditLabel } from '~/utils/admin'

// Admin actions as a list: who, what, on what (linked to its page where there is one), when, and the details
// worth reading (from → to, the note sent, a removed review's text)
const props = defineProps<{ entries: AuditEntry[], empty?: string }>()

const detailLine = (d: Record<string, unknown>) => [
  d.from && d.to ? `${String(d.from).replace('_', ' ')} → ${String(d.to).replace('_', ' ')}` : '',
  d.name ? String(d.name) : '',
  d.store ? `store ${d.store}` : '',
  d.inspector ? `inspector ${d.inspector}` : '',
].filter(Boolean).join(' · ')
const linkOf = (a: AuditEntry) => (a.target_type === 'store' ? `/admin/stores/${a.target_id}` : a.target_type === 'person' ? `/admin/people/${a.target_id}` : undefined)
</script>

<template>
  <ol v-if="props.entries.length" class="m-0 flex list-none flex-col p-0">
    <li v-for="a in props.entries" :key="a.id" class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-line px-5 py-3 first:border-t-0 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <span class="row-span-2 mt-0.5 grid size-8 place-items-center rounded-full bg-surface-sunk text-[11px] font-bold">{{ initialsOf(a.actor_name || '?') }}</span>
      <span class="text-[13.5px]">
        <strong class="font-semibold">{{ auditLabel(a.action) }}</strong>
        <span class="font-mono text-[12px] text-ink-muted"> · {{ a.target_type }} </span>
        <NuxtLink v-if="linkOf(a)" :to="linkOf(a)!" class="font-mono text-[12px] text-ink">{{ a.target_id.length > 20 ? `${a.target_id.slice(0, 8)}…` : a.target_id }}</NuxtLink>
        <span v-else class="font-mono text-[12px] text-ink-muted">{{ a.target_id.length > 20 ? `${a.target_id.slice(0, 8)}…` : a.target_id }}</span>
      </span>
      <span class="col-start-2 font-mono text-[11.5px] text-ink-muted sm:col-start-3 sm:row-start-1 sm:text-right">{{ adminTime(a.created_at) }}</span>
      <span class="col-start-2 flex flex-col gap-1 text-[12.5px] leading-[18px] text-ink-muted">
        <span>by {{ a.actor_name || 'someone' }}<template v-if="detailLine(a.detail)"> · {{ detailLine(a.detail) }}</template></span>
        <span v-if="a.detail.note" class="rounded-md bg-surface-sunk px-2.5 py-1.5 text-ink">"{{ a.detail.note }}"</span>
        <span v-if="a.detail.body" class="line-clamp-2 italic">Review: "{{ a.detail.body }}"</span>
      </span>
    </li>
  </ol>
  <p v-else class="m-0 px-5 py-4 text-[13px] text-ink-muted">{{ props.empty ?? 'No admin actions yet.' }}</p>
</template>
