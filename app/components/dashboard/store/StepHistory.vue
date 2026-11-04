<script setup lang="ts">
import { Plus, X } from '@lucide/vue'
import { useFieldArray, useFormErrors } from 'vee-validate'

// Profile step: moments in the kennel's history, shown to buyers as a timeline (oldest first), up to 12
const { fields: rows, push, remove } = useFieldArray<{ year: number, text: string }>('history')
const errors = useFormErrors()
const rowError = (i: number) => (errors.value as Record<string, string | undefined>)[`history[${i}].year`] ?? (errors.value as Record<string, string | undefined>)[`history[${i}].text`]
</script>

<template>
  <div class="flex flex-col gap-4">
    <ol v-if="rows.length" class="m-0 flex list-none flex-col gap-3 p-0">
      <li v-for="(row, i) in rows" :key="row.key" class="flex flex-col gap-1.5">
        <div class="flex items-start gap-2">
          <Input v-model="row.value.year" inputmode="numeric" maxlength="4" :aria-label="`Year of moment ${i + 1}`" placeholder="2014" class="h-11 w-[5.5rem] shrink-0 border-2 border-line-strong font-mono" />
          <Input v-model="row.value.text" maxlength="160" :aria-label="`What happened, moment ${i + 1}`" placeholder="Founded in Kuje with two imported German Shepherd females" class="h-11 flex-1 border-2 border-line-strong" />
          <Button type="button" variant="ghost" size="icon" :aria-label="`Remove moment ${i + 1}`" @click="remove(i)"><X aria-hidden="true" /></Button>
        </div>
        <p v-if="rowError(i)" class="m-0 text-[13px] font-semibold text-danger">{{ rowError(i) }}</p>
      </li>
    </ol>
    <p v-else class="m-0 rounded-lg bg-surface-sunk p-4 text-sm text-ink-muted">No moments yet. Start with the year you founded the kennel.</p>
    <Button v-if="rows.length < 12" type="button" variant="outline" size="sm" class="w-fit" @click="push({ year: new Date().getFullYear(), text: '' })">
      <Plus aria-hidden="true" />Add a moment
    </Button>
  </div>
</template>
