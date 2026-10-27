<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'
import type { LegalDoc } from '~/utils/legal'

// A legal page: heading, draft notice, contents on the side (wide screens), numbered sections
const props = defineProps<{ doc: LegalDoc }>()
</script>

<template>
  <div :class="[homeSection, 'flex flex-col gap-8 py-8 sm:py-10']">
    <header class="flex max-w-[44em] flex-col gap-4">
      <span class="font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">Dogeash · Draft</span>
      <h1 class="m-0 mega text-[clamp(34px,4.2vw,56px)] leading-[.95]">{{ props.doc.title }} <span class="text-outline">{{ props.doc.outline }}</span></h1>
      <p class="m-0 text-[17px] leading-7 text-ink-muted">{{ props.doc.intro }}</p>
      <p class="m-0 flex gap-3 rounded-lg bg-marigold-soft p-4 text-sm leading-[22px]">
        <TriangleAlert class="mt-0.5 size-[18px] shrink-0 text-marigold-ink" aria-hidden="true" />
        <span><strong>This is a draft.</strong> It explains how Dogeash intends to work and will be reviewed by a lawyer before launch. It is not yet a binding agreement.</span>
      </p>
    </header>

    <div class="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Contents" class="sticky top-[calc(var(--header-height)+16px)] hidden flex-col gap-1 self-start lg:flex">
        <span class="pb-2 font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">Contents</span>
        <a v-for="(s, i) in props.doc.sections" :key="s.id" :href="`#${s.id}`" class="flex gap-2.5 rounded-md px-2 py-1.5 text-sm font-semibold text-ink-muted no-underline hover:bg-surface-sunk hover:text-ink">
          <span class="font-mono text-xs tabular-nums">{{ String(i + 1).padStart(2, '0') }}</span>{{ s.heading }}
        </a>
      </nav>

      <div class="flex max-w-[44em] flex-col">
        <section v-for="(s, i) in props.doc.sections" :id="s.id" :key="s.id" class="flex scroll-mt-28 flex-col gap-3 border-t border-line py-7 first:border-t-4 first:border-ink">
          <h2 class="m-0 flex items-baseline gap-3 font-display text-xl leading-7 font-extrabold font-stretch-expanded">
            <span class="font-mono text-sm font-semibold text-ink-muted tabular-nums">{{ String(i + 1).padStart(2, '0') }}</span>{{ s.heading }}
          </h2>
          <p v-for="p in s.body" :key="p" class="m-0 text-[15px] leading-[26px]">{{ p }}</p>
        </section>
      </div>
    </div>
  </div>
</template>
