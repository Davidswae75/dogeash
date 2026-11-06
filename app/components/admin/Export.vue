<script setup lang="ts" generic="T">
import { Download } from '@lucide/vue'
import type { CsvColumn } from '~/utils/csv'
import { downloadCsv } from '~/utils/csv'

// "Download CSV" for an admin list: exactly the rows on screen (after filters), with the given columns
const props = defineProps<{ name: string, rows: T[], columns: CsvColumn<T>[] }>()
</script>

<template>
  <Button variant="outline" size="sm" class="h-9" :disabled="!props.rows.length" :title="`Download ${props.rows.length} rows as a CSV file`" @click="downloadCsv(props.name, props.rows, props.columns)">
    <Download aria-hidden="true" />CSV
  </Button>
</template>
