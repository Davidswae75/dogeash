<script setup lang="ts">
import type { AuditEntry } from '~/utils/admin'
import { initialsOf } from '~/utils/account'
import { shortTime } from '~/utils/time'

// The latest admin actions as a feed: who, what, on what, when
const props = defineProps<{ entries: AuditEntry[] }>()
</script>

<template>
  <AdminCard title="Admin activity" description="Every approval, rejection and suspension is recorded" flush>
    <ol v-if="props.entries.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="a in props.entries" :key="a.id" class="flex items-start gap-3 border-t border-line px-5 py-2.5">
        <span class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-sunk text-[10.5px] font-bold">{{ initialsOf(a.actor_name || '?') }}</span>
        <span class="flex min-w-0 flex-1 flex-col leading-snug">
          <span class="text-[13px]"><strong class="font-medium">{{ a.actor_name || 'Someone' }}</strong> <span class="font-mono text-[12px]">{{ a.action }}</span></span>
          <span class="font-mono text-[11.5px] text-ink-muted">{{ a.target_type }} {{ a.target_id }}</span>
        </span>
        <span class="shrink-0 font-mono text-[11px] text-ink-muted">{{ shortTime(a.created_at) }}</span>
      </li>
    </ol>
    <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">Nothing yet. Admin actions appear here as they happen.</p>
  </AdminCard>
</template>
