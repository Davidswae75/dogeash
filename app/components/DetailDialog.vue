<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'

// Everything about one item, in a dialog: lists show a few key facts per row, and a click opens this.
// `sections` are labelled groups of label/value rows; empty values are left out. Extra content goes in the
// default slot (a message, a note); actions for the item go in `actions`, along the bottom beside Close.
export interface DetailRow {
  label: string
  value?: string | number | null
  /** File numbers, references, amounts: monospaced */
  mono?: boolean
  /** A page on the site to open (the value becomes a link) */
  to?: string
  /** Opens in a new tab (a public page) */
  external?: boolean
  /** Long text: takes the full width, kept as written */
  long?: boolean
}
export interface DetailSection { title?: string, rows: DetailRow[] }

const props = defineProps<{ title: string, subtitle?: string, sections: DetailSection[] }>()
const open = defineModel<boolean>('open', { default: false })

const shown = (s: DetailSection) => s.rows.filter(r => r.value !== undefined && r.value !== null && String(r.value).trim() !== '')
// Two facts to a line on wider screens; a fact left alone on its line (before a long one, or last) takes the
// whole line, so there's never an empty half-cell
function wide(s: DetailSection) {
  const rows = shown(s)
  const out: boolean[] = []
  let col = 0
  rows.forEach((r, i) => {
    const next = rows[i + 1]
    if (r.long) { out.push(true); col = 0; return }
    const alone = col === 0 && (!next || !!next.long)
    out.push(alone)
    col = alone ? 0 : 1 - col
  })
  return out
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[92dvh] gap-5 overflow-y-auto sm:max-w-[600px]">
      <DialogHeader class="text-left">
        <DialogTitle class="pr-6 text-lg leading-6">{{ props.title }}</DialogTitle>
        <DialogDescription v-if="props.subtitle">{{ props.subtitle }}</DialogDescription>
      </DialogHeader>

      <slot name="top" />

      <section v-for="(s, i) in props.sections" v-show="shown(s).length" :key="i" class="flex flex-col gap-2">
        <h3 v-if="s.title" class="m-0 font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ s.title }}</h3>
        <dl class="m-0 grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line sm:grid-cols-2">
          <div v-for="(r, ri) in shown(s)" :key="r.label" :class="['flex min-w-0 flex-col gap-0.5 bg-surface px-3 py-2.5', wide(s)[ri] && 'sm:col-span-2']">
            <dt class="text-[11.5px] text-ink-muted">{{ r.label }}</dt>
            <dd :class="['m-0 text-[13.5px] leading-5 break-words', r.mono && 'font-mono text-[12.5px]', r.long && 'whitespace-pre-line']">
              <NuxtLink v-if="r.to" :to="r.to" :target="r.external ? '_blank' : undefined" class="inline-flex items-center gap-1 text-ink underline-offset-4 hover:underline">
                {{ r.value }}<ExternalLink v-if="r.external" class="size-3" aria-hidden="true" />
              </NuxtLink>
              <template v-else>{{ r.value }}</template>
            </dd>
          </div>
        </dl>
      </section>

      <slot />

      <!-- Always a way out, and the item's actions beside it: one compact row, pinned to the bottom while the
           details scroll. On narrow screens the actions share the space after Close. -->
      <div class="sticky -bottom-6 z-10 -mx-6 -mb-6 flex items-center gap-2 border-t border-line bg-background px-4 py-2 sm:px-6">
        <DialogClose as-child>
          <Button variant="ghost" size="sm" class="h-8 shrink-0 px-2.5 text-[13px]">Close</Button>
        </DialogClose>
        <div v-if="$slots.actions" class="ml-auto flex min-w-0 flex-1 items-stretch justify-end gap-1.5 [&>*]:min-h-8 [&>*]:min-w-0 [&>*]:px-3 [&>*]:text-[12.5px] max-sm:[&>*]:h-auto max-sm:[&>*]:flex-1 max-sm:[&>*]:py-1 max-sm:[&>*]:leading-4 max-sm:[&>*]:whitespace-normal sm:[&>*]:h-8">
          <slot name="actions" />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
