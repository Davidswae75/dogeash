// CSV files for admin exports: a header row of labels, then one row per item. Values are quoted when they
// contain commas, quotes or line breaks, so Excel and Google Sheets read them as they are.
export interface CsvColumn<T> { label: string, value: (row: T) => string | number | boolean | null | undefined }

const cell = (v: string | number | boolean | null | undefined) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const toCsv = <T>(rows: T[], columns: CsvColumn<T>[]) =>
  [columns.map(c => cell(c.label)).join(','), ...rows.map(r => columns.map(c => cell(c.value(r))).join(','))].join('\r\n')

// Saves the CSV in the browser, named like "dogeash-stores-2026-11-06.csv"
export function downloadCsv<T>(name: string, rows: T[], columns: CsvColumn<T>[]) {
  const blob = new Blob([`﻿${toCsv(rows, columns)}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dogeash-${name}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
