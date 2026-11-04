<script setup lang="ts">
import { CalendarDays } from '@lucide/vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useStoreInbox } from '~/composables/useStoreInbox'

// Kennel visits for the store: requests waiting for an answer, confirmed visits still to come, then everything earlier.
// The dashboard layout loads them with the inbox; deciding here is the same as deciding in the inbox.
definePageMeta({ layout: 'dashboard', title: 'Bookings', middleware: 'store-member' })
useSeoMeta({ title: 'Bookings · Store dashboard · Dogeash', robots: 'noindex' })

const { waiting, confirmed, earlier, decideVisit } = useStoreInbox()
</script>

<template>
  <div class="flex flex-col gap-8">
    <p class="m-0 max-w-[44em] text-[15px] leading-6 text-ink-muted">
      Buyers ask to visit your kennel from your store and dog pages. Answer each request; they see your decision and note in their visits.
    </p>

    <section v-if="waiting.length" class="flex flex-col gap-3">
      <h2 class="m-0 flex items-baseline gap-2 font-display text-xl font-extrabold font-stretch-expanded">
        Waiting for your answer <span class="font-mono text-sm text-ink-muted">{{ waiting.length }}</span>
      </h2>
      <div v-for="v in waiting" :key="v.id" class="rounded-xl bg-surface ring-1 ring-marigold">
        <DashboardInboxVisit :visit="v" :decide="(status, note) => decideVisit(v, status, note)" />
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="m-0 flex items-baseline gap-2 font-display text-xl font-extrabold font-stretch-expanded">
        Coming up <span class="font-mono text-sm text-ink-muted">{{ confirmed.length }}</span>
      </h2>
      <div v-for="v in confirmed" :key="v.id" class="rounded-xl bg-surface ring-1 ring-line">
        <DashboardInboxVisit :visit="v" :decide="(status, note) => decideVisit(v, status, note)" />
      </div>
      <div v-if="!confirmed.length" class="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-10 text-center ring-1 ring-line">
        <CalendarDays class="size-6 text-ink-muted" aria-hidden="true" />
        <p class="m-0 max-w-[32em] text-sm leading-[21px] text-ink-muted">
          No confirmed visits ahead.{{ waiting.length ? ' Confirm a request above and it moves here.' : ' Requests from buyers appear here and in your inbox.' }}
        </p>
      </div>
    </section>

    <section v-if="earlier.length" class="flex flex-col gap-3">
      <h2 class="m-0 font-display text-xl font-extrabold font-stretch-expanded">Earlier</h2>
      <VisitCard v-for="v in earlier" :key="v.id" :visit="v" side="store" muted />
    </section>
  </div>
</template>
