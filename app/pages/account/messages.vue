<script setup lang="ts">
import { ArrowLeft, MessageSquare } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, useSeoMeta } from '#imports' // nuxt
import type { ThreadMessage } from '~/composables/useConversations'
import { useConversations } from '~/composables/useConversations'
import { cn } from '~/lib/utils'
import { findDog } from '~/utils/dogs'
import { shortTime } from '~/utils/time'

// Messages with stores. Wide screens: list beside the open conversation; phones: the list, then the
// conversation with a way back. `?id=` opens one (the "Open conversation" toast links here).
// While a conversation is open it checks for replies every 20 seconds.
useSeoMeta({ title: 'Messages · My Dogeash' })

const route = useRoute()
const router = useRouter()
const conversations = useConversations()
const { mine } = conversations

const selectedId = computed(() => (route.query.id ? String(route.query.id) : undefined))
const selected = computed(() => mine.value.find(c => c.id === selectedId.value))
const messages = ref<ThreadMessage[]>([])
const dogName = (fileNo: string | null) => (fileNo ? findDog(fileNo)?.name : undefined)

async function openThread(id: string | undefined) {
  if (!id) return (messages.value = [])
  messages.value = await conversations.thread(id)
  await conversations.markRead(id)
}
watch(selectedId, openThread)

const open = (id: string) => router.replace({ query: { id } })
const back = () => router.replace({ query: {} })

async function reply(text: string) {
  const error = await conversations.send(selectedId.value!, 'buyer', text)
  if (!error) {
    messages.value = await conversations.thread(selectedId.value!)
    await conversations.loadMine()
  }
  return error
}

let timer: ReturnType<typeof setInterval> | undefined
onMounted(async () => {
  await conversations.loadMine()
  if (!selectedId.value && mine.value[0] && window.matchMedia('(min-width: 1024px)').matches) open(mine.value[0].id)
  else await openThread(selectedId.value)
  timer = setInterval(async () => {
    if (!selectedId.value || document.hidden) return
    const latest = await conversations.thread(selectedId.value)
    if (latest.length !== messages.value.length) {
      messages.value = latest
      await conversations.markRead(selectedId.value)
    }
  }, 20000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="flex flex-col gap-6">
    <AccountHeading kicker="Messages · with stores" title="Your" outline="messages" text="Questions you've asked stores, and their replies. Write from any dog or store page with Contact store." />

    <div v-if="mine.length" class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
      <ul :class="cn('m-0 flex list-none flex-col overflow-hidden rounded-xl bg-surface p-1.5 ring-1 ring-line', selected && 'max-lg:hidden')">
        <li v-for="c in mine" :key="c.id">
          <button
            type="button"
            :class="cn('flex w-full cursor-pointer gap-3 rounded-lg border-0 p-3 text-left text-ink', c.id === selectedId ? 'bg-surface-sunk ring-1 ring-line-strong' : 'bg-transparent hover:bg-surface-sunk')"
            @click="open(c.id)"
          >
            <StoreAvatar :initials="c.storeInitials" class="size-10 shrink-0 rounded-lg" />
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="flex items-baseline gap-2">
                <span :class="cn('flex-1 truncate text-sm leading-5', c.unreadForBuyer ? 'font-bold' : 'font-semibold')">{{ c.storeName }}<template v-if="dogName(c.dogFileNo)"> · {{ dogName(c.dogFileNo) }}</template></span>
                <span class="shrink-0 font-mono text-[10.5px] text-ink-muted">{{ shortTime(c.lastAt) }}</span>
              </span>
              <span :class="cn('truncate text-[13px]', c.unreadForBuyer ? 'text-ink' : 'text-ink-muted')">{{ c.lastSender === 'buyer' ? 'You: ' : '' }}{{ c.preview }}</span>
            </span>
            <span v-if="c.unreadForBuyer" class="mt-1.5 size-2 shrink-0 rounded-full bg-marigold" aria-label="Unread" />
          </button>
        </li>
      </ul>

      <section v-if="selected" class="flex max-h-[calc(100dvh-180px)] min-h-[420px] min-w-0 flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-line lg:sticky lg:top-[calc(var(--header-height)+16px)]">
        <header class="flex items-center gap-3 border-b border-line p-4">
          <button type="button" class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-[1.5px] border-line-strong bg-transparent text-ink lg:hidden" aria-label="Back to messages" @click="back">
            <ArrowLeft class="size-4" aria-hidden="true" />
          </button>
          <StoreAvatar :initials="selected.storeInitials" class="size-10 shrink-0 rounded-lg" />
          <div class="flex min-w-0 flex-1 flex-col">
            <NuxtLink :to="`/stores/${selected.storeSlug}`" class="truncate font-display text-[17px] leading-6 font-extrabold text-ink no-underline font-stretch-expanded hover:underline">{{ selected.storeName }}</NuxtLink>
            <span v-if="selected.dogFileNo" class="text-[13px] text-ink-muted">
              About <NuxtLink :to="`/dogs/${selected.dogFileNo.toLowerCase()}`" class="font-semibold text-ink">{{ dogName(selected.dogFileNo) ?? selected.dogFileNo }}</NuxtLink>
            </span>
          </div>
        </header>
        <ConversationThread :messages="messages" self="buyer" :other-name="selected.storeName" />
        <ConversationReply
          :conversation-id="selected.id"
          :placeholder="`Reply to ${selected.storeName}`"
          footnote="The store sees your name, not your phone number or email."
          :send="reply"
        />
      </section>
      <div v-else class="hidden min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line-strong p-8 text-center text-ink-muted lg:flex">
        <MessageSquare class="size-8" aria-hidden="true" />
        <p class="m-0 text-sm">Choose a conversation to read it here.</p>
      </div>
    </div>

    <div v-else class="flex flex-col items-center gap-4 rounded-xl bg-surface px-6 py-14 text-center ring-1 ring-line">
      <span class="grid size-14 place-items-center rounded-full bg-marigold-soft"><MessageSquare class="size-6" aria-hidden="true" /></span>
      <h2 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">No messages yet</h2>
      <p class="m-0 max-w-[32em] text-[15px] leading-6 text-ink-muted">Ask a store about a dog with "Contact store" on its page. Their reply shows up here.</p>
      <Button as-child><NuxtLink to="/dogs">Find a guard dog</NuxtLink></Button>
    </div>
  </div>
</template>
