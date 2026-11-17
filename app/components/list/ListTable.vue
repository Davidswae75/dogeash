<script setup lang="ts" generic="T">
import { ChevronRight } from '@lucide/vue'

// The one table design for lists across Dogeash. Each column says how it shows on phones, where the table
// becomes stacked cards (no sideways scrolling):
//   'title' – the card's heading (one column); 'meta' – a quiet line under it; 'row' – a label and value;
//   'end' – top right of the card (a status or a price); 'hide' – left out on phones.
// Cells render the row's value, or a `cell-<key>` slot. With `@open`, the whole row opens the item.
export interface DataColumn {
  key: string
  label: string
  align?: 'left' | 'right'
  /** Monospaced, tabular numbers (money, codes, dates) */
  mono?: boolean
  /** Fixed width, like 'w-28' */
  width?: string
  mobile?: 'title' | 'meta' | 'row' | 'end' | 'hide'
}
const props = withDefaults(defineProps<{ rows: T[], columns: DataColumn[], rowKey: (row: T) => string, rowLabel?: (row: T) => string, clickable?: boolean, minWidth?: string }>(), { clickable: true, minWidth: '720px' })
const emit = defineEmits<{ open: [row: T] }>()
const value = (row: T, key: string) => (row as Record<string, unknown>)[key] as string | number | undefined
const by = (m: DataColumn['mobile']) => props.columns.filter(c => (c.mobile ?? 'row') === m)
</script>

<template>
  <div class="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
    <!-- Wide screens: a table -->
    <div class="relative hidden overflow-x-auto md:block">
      <table class="w-full border-collapse text-left text-sm" :style="{ minWidth: props.minWidth }">
        <thead>
          <tr class="bg-surface-sunk/60">
            <th v-for="c in props.columns" :key="c.key" scope="col" :class="['px-3 py-3 font-mono text-[10.5px] font-semibold tracking-[.1em] whitespace-nowrap text-ink-muted uppercase first:pl-5', c.align === 'right' && 'text-right', c.width]">{{ c.label }}</th>
            <th v-if="$slots.actions || props.clickable" scope="col" class="w-10 pr-3"><span class="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in props.rows"
            :key="props.rowKey(row)"
            :tabindex="props.clickable ? 0 : undefined"
            :aria-label="props.clickable && props.rowLabel ? `${props.rowLabel(row)}. Open details` : undefined"
            :class="['group border-t border-line align-middle', props.clickable && 'cursor-pointer outline-none hover:bg-surface-sunk/70 focus-visible:bg-surface-sunk/70']"
            @click="props.clickable && emit('open', row)"
            @keydown.enter.prevent="props.clickable && emit('open', row)"
          >
            <td v-for="c in props.columns" :key="c.key" :class="['px-3 py-3 first:pl-5', c.align === 'right' && 'text-right', c.mono && 'font-mono text-[13px] tabular-nums', c.width]">
              <slot :name="`cell-${c.key}`" :row="row">{{ value(row, c.key) ?? '—' }}</slot>
            </td>
            <td v-if="$slots.actions || props.clickable" class="pr-3 text-right whitespace-nowrap" @click="$slots.actions && $event.stopPropagation()">
              <slot name="actions" :row="row"><ChevronRight class="inline size-4 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Phones: stacked cards -->
    <ul class="m-0 flex list-none flex-col divide-y divide-line p-0 md:hidden">
      <li v-for="row in props.rows" :key="props.rowKey(row)">
        <component
          :is="props.clickable ? 'button' : 'div'"
          :type="props.clickable ? 'button' : undefined"
          class="flex w-full flex-col gap-2.5 border-0 bg-transparent p-4 text-left text-ink"
          :class="props.clickable && 'cursor-pointer active:bg-surface-sunk'"
          @click="props.clickable && emit('open', row)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 flex-col gap-0.5">
              <div v-for="c in by('title')" :key="c.key" class="min-w-0 font-semibold"><slot :name="`cell-${c.key}`" :row="row">{{ value(row, c.key) }}</slot></div>
              <div v-if="by('meta').length" class="flex flex-wrap gap-x-2 text-[13px] text-ink-muted">
                <span v-for="c in by('meta')" :key="c.key" :class="c.mono && 'font-mono tabular-nums'"><slot :name="`cell-${c.key}`" :row="row">{{ value(row, c.key) }}</slot></span>
              </div>
            </div>
            <div v-for="c in by('end')" :key="c.key" :class="['shrink-0 text-right', c.mono && 'font-mono text-[13px] font-semibold tabular-nums']"><slot :name="`cell-${c.key}`" :row="row">{{ value(row, c.key) }}</slot></div>
          </div>
          <dl v-if="by('row').length" class="m-0 grid grid-cols-2 gap-x-4 gap-y-2">
            <div v-for="c in by('row')" :key="c.key" class="flex min-w-0 flex-col gap-0.5">
              <dt class="font-mono text-[10px] font-semibold tracking-[.1em] text-ink-muted uppercase">{{ c.label }}</dt>
              <dd :class="['m-0 min-w-0 text-[13px]', c.mono && 'font-mono tabular-nums']"><slot :name="`cell-${c.key}`" :row="row">{{ value(row, c.key) ?? '—' }}</slot></dd>
            </div>
          </dl>
        </component>
        <div v-if="$slots.actions" class="flex flex-wrap gap-2 px-4 pb-4 -mt-1"><slot name="actions" :row="row" /></div>
      </li>
    </ul>
  </div>
</template>
