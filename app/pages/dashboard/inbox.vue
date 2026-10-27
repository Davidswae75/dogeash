<script setup lang="ts">
import { Inbox } from '@lucide/vue'
import type { InboxKind } from '~/utils/inbox'

// The store inbox: everything that needs a reply or a decision, in one place.
// Wide screens: list beside the open item. Phones: the list, then the item full width with a way back.
// `?id=` opens an item (so a notification email can link straight to it); `?type=` sets the filter.
definePageMeta({ layout: 'dashboard', title: 'Inbox', middleware: 'store-member' })
useSeoMeta({ title: 'Inbox · Store dashboard · Dogeash', robots: 'noindex' })

const route = useRoute()
const router = useRouter()
const { items, unread, find, markRead, reply, act } = useStoreInbox()

const selectedId = computed(() => (route.query.id ? String(route.query.id) : undefined))
const selected = computed(() => (selectedId.value ? find(selectedId.value) : undefined))
const filter = computed<InboxKind | 'all'>({
  get: () => (route.query.type as InboxKind) || 'all',
  set: type => router.replace({ query: { ...route.query, type: type === 'all' ? undefined : type } }),
})

function open(id: string) {
  markRead(id)
  router.replace({ query: { ...route.query, id } })
}
const back = () => router.replace({ query: { ...route.query, id: undefined } })

// Opening the page on wide screens shows the first item rather than an empty pane
onMounted(() => {
  if (!selectedId.value && items.value[0] && window.matchMedia('(min-width: 1024px)').matches) open(items.value[0].id)
  else if (selectedId.value) markRead(selectedId.value)
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex flex-col gap-1.5">
        <span class="font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ unread }} unread · {{ items.length }} in all</span>
        <p class="m-0 max-w-[44em] text-[15px] leading-6 text-ink-muted">Messages from buyers, booking requests, payments and reviews. Reply here; buyers also get your reply by email, SMS or WhatsApp.</p>
      </div>
    </header>

    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
      <DashboardInboxList v-model:filter="filter" :items="items" :selected="selectedId" :class="selected && 'max-lg:hidden'" @open="open" />
      <DashboardInboxDetail
        v-if="selected"
        :item="selected"
        class="lg:sticky lg:top-[88px] lg:max-h-[calc(100dvh-112px)]"
        @back="back"
        @reply="reply(selected.id, $event)"
        @act="act(selected.id, $event)"
      />
      <div v-else class="hidden min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line-strong p-8 text-center text-ink-muted lg:flex">
        <Inbox class="size-8" aria-hidden="true" />
        <p class="m-0 text-sm">Choose a message or update to see it here.</p>
      </div>
    </div>
  </div>
</template>
