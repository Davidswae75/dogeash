<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { MessageSide, ThreadMessage } from '~/composables/useConversations'
import { cn } from '~/lib/utils'
import { shortTime } from '~/utils/time'

// The messages of one conversation as bubbles: yours on the right in charcoal, theirs on the left.
// Scrolls to the newest message. Shared by the buyer's Messages and the store inbox.
const props = defineProps<{ messages: ThreadMessage[], self: MessageSide, otherName: string }>()
const list = ref<HTMLElement>()

watch(() => props.messages.length, async () => {
  await nextTick()
  list.value?.scrollTo({ top: list.value.scrollHeight })
}, { immediate: true })
</script>

<template>
  <ol ref="list" class="m-0 flex min-h-0 flex-1 list-none flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
    <li v-for="m in props.messages" :key="m.id" :class="cn('flex max-w-[85%] flex-col gap-1', m.from === props.self ? 'items-end self-end' : 'self-start')">
      <span class="font-mono text-[10px] text-ink-muted">{{ m.from === props.self ? 'You' : props.otherName }} · {{ shortTime(m.at) }}</span>
      <p :class="cn('m-0 rounded-2xl px-3.5 py-2.5 text-sm leading-[21px] whitespace-pre-line', m.from === props.self ? 'rounded-br-md bg-night text-on-night' : 'rounded-bl-md bg-surface-sunk text-ink')">{{ m.body }}</p>
    </li>
    <li v-if="!props.messages.length" class="m-auto text-sm text-ink-muted">No messages yet.</li>
  </ol>
</template>
