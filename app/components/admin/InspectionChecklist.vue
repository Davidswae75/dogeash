<script setup lang="ts">
import type { InspectionCheck } from '~/utils/inspections'
import { standardChecks } from '~/utils/inspections'

// The inspection checks: each one passed or failed, with a note. `readonly` once the inspection is finished.
const checks = defineModel<InspectionCheck[]>({ required: true })
const props = defineProps<{ readonly?: boolean }>()
const hint = (key: string) => standardChecks.find(c => c.key === key)?.hint
const set = (i: number, patch: Partial<InspectionCheck>) => { checks.value = checks.value.map((c, j) => (j === i ? { ...c, ...patch } : c)) }
const marked = () => checks.value.filter(c => c.ok !== null).length
</script>

<template>
  <AdminCard title="Checklist" :description="`${marked()} of ${checks.length} marked · every check needs a pass or fail before the result`" flush>
    <ol class="m-0 flex list-none flex-col p-0">
      <li v-for="(c, i) in checks" :key="c.key" class="flex flex-col gap-2 border-t border-line px-5 py-3.5 lg:flex-row lg:items-start lg:gap-5">
        <span class="flex min-w-0 flex-1 flex-col leading-tight">
          <span class="text-[14px] font-semibold">{{ i + 1 }}. {{ c.label }}</span>
          <span class="text-[12.5px] text-ink-muted">{{ hint(c.key) }}</span>
        </span>
        <div class="flex flex-col gap-2 lg:w-[360px]">
          <ToggleGroup
            :model-value="c.ok === null ? '' : c.ok ? 'pass' : 'fail'"
            type="single"
            variant="outline"
            size="sm"
            :disabled="props.readonly"
            :aria-label="`${c.label}: passed or failed`"
            class="w-fit"
            @update:model-value="v => set(i, { ok: v === 'pass' ? true : v === 'fail' ? false : null })"
          >
            <ToggleGroupItem value="pass" class="px-3 text-xs data-[state=on]:bg-cat-1/15">Passed</ToggleGroupItem>
            <ToggleGroupItem value="fail" class="px-3 text-xs data-[state=on]:bg-danger/12 data-[state=on]:text-danger">Failed</ToggleGroupItem>
          </ToggleGroup>
          <Input :model-value="c.note" :disabled="props.readonly" maxlength="300" placeholder="Note (optional)" :aria-label="`Note on ${c.label}`" class="h-9 text-sm" @update:model-value="v => set(i, { note: String(v) })" />
        </div>
      </li>
    </ol>
  </AdminCard>
</template>
