<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import type { ThreadMessage } from '~/composables/useConversations'
import type { VisitStatus } from '~/composables/useVisits'
import type { InboxItem } from '~/utils/inbox'
import { cn } from '~/lib/utils'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useConversations } from '~/composables/useConversations'
import { useStoreContext } from '~/composables/useStoreContext'
import { findDog } from '~/utils/dogs'
import { inboxKinds, quickReplies } from '~/utils/inbox'
import { shortTime } from '~/utils/time'

// One inbox item: a conversation with the buyer and a reply box, or a visit request to decide on.
// An open conversation checks for new messages every 20 seconds.
const props = defineProps<{
  item: InboxItem
  reply: (text: string) => Promise<string | null>
  decide: (status: VisitStatus, note: string) => Promise<void>
}>()
const emit = defineEmits<{ back: [] }>()
const { store } = useStoreContext()
const conversations = useConversations()

const dog = computed(() => props.item.dogFileNo ? findDog(props.item.dogFileNo) : undefined)
const messages = ref<ThreadMessage[]>([])
const conversationId = computed(() => props.item.conversation?.id)

async function loadThread() {
  messages.value = conversationId.value ? await conversations.thread(conversationId.value) : []
}
watch(conversationId, loadThread, { immediate: true })

async function send(text: string) {
  const error = await props.reply(text)
  if (!error) await loadThread()
  return error
}

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => { if (conversationId.value && !document.hidden) loadThread() }, 20000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section class="flex min-w-0 flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-line">
    <header class="flex items-start gap-3 border-b border-line p-4">
      <button type="button" class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-[1.5px] border-line-strong bg-transparent text-ink lg:hidden" aria-label="Back to inbox" @click="emit('back')">
        <ArrowLeft class="size-4" aria-hidden="true" />
      </button>
      <span :class="cn('hidden size-10 shrink-0 place-items-center rounded-md sm:grid', inboxKinds[props.item.kind].tile)">
        <component :is="inboxKinds[props.item.kind].icon" class="size-[18px]" aria-hidden="true" />
      </span>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ inboxKinds[props.item.kind].label }} · {{ shortTime(props.item.at) }}</span>
        <h2 class="m-0 font-display text-lg leading-6 font-extrabold font-stretch-expanded">{{ props.item.subject }}</h2>
        <span class="flex flex-wrap items-center gap-x-3 text-[13px] text-ink-muted">
          {{ props.item.from }}
          <ReportButton v-if="props.item.conversation" kind="conversation" :target-id="props.item.conversation.id" what="this conversation" class="text-xs" />
        </span>
      </div>
      <NuxtLink v-if="dog" :to="`/dogs/${dog.fileNo.toLowerCase()}`" class="hidden shrink-0 items-center gap-2 rounded-lg p-1.5 pr-3 text-ink no-underline ring-1 ring-line hover:ring-ink sm:flex">
        <img v-if="dog.photo" :src="dog.photo" alt="" class="size-9 rounded-md object-cover">
        <span class="flex flex-col">
          <strong class="text-[13px] leading-4">{{ dog.name }}</strong>
          <span class="font-mono text-[10px] text-ink-muted">{{ dog.fileNo }}</span>
        </span>
      </NuxtLink>
    </header>

    <template v-if="props.item.conversation">
      <ConversationThread :messages="messages" self="store" :other-name="props.item.from" />
      <ConversationReply
        :conversation-id="props.item.conversation.id"
        :placeholder="`Reply to ${props.item.from}`"
        :footnote="`Sending as ${store.name}. ${props.item.from} sees it in their Messages.`"
        :quick-replies="quickReplies"
        :send="send"
      />
    </template>

    <DashboardInboxVisit v-else-if="props.item.visit" :visit="props.item.visit" :decide="props.decide" />
  </section>
</template>
