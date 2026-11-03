<script setup lang="ts">
import { SendHorizontal } from '@lucide/vue'
import { ref, watch } from 'vue'

// Reply box under a conversation: optional quick replies, who it's sent as, and what happens to it.
// `send` returns an error message, or null when sent. Cmd/Ctrl+Enter sends.
const props = defineProps<{
  conversationId: string
  placeholder: string
  footnote: string
  quickReplies?: string[]
  send: (text: string) => Promise<string | null>
}>()

const text = ref('')
const error = ref('')
const busy = ref(false)
watch(() => props.conversationId, () => { text.value = error.value = '' })
watch(text, () => { error.value = '' })

async function submit() {
  if (busy.value) return
  if (text.value.trim().length < 2) return (error.value = 'Write a reply first.')
  busy.value = true
  error.value = (await props.send(text.value.trim())) ?? ''
  busy.value = false
  if (!error.value) text.value = ''
}
</script>

<template>
  <form class="flex flex-col gap-3 border-t border-line p-4" @submit.prevent="submit">
    <div v-if="props.quickReplies?.length" class="flex flex-wrap gap-1.5">
      <button
        v-for="q in props.quickReplies"
        :key="q"
        type="button"
        class="cursor-pointer rounded-full border-[1.5px] border-line-strong bg-transparent px-2.5 py-1 text-xs font-semibold text-ink hover:border-ink"
        @click="text = q"
      >{{ q }}</button>
    </div>
    <label :for="`reply-${props.conversationId}`" class="sr-only">{{ props.placeholder }}</label>
    <Textarea
      :id="`reply-${props.conversationId}`"
      v-model="text"
      rows="3"
      :placeholder="props.placeholder"
      class="border-line-strong"
      @keydown.meta.enter="submit"
      @keydown.ctrl.enter="submit"
    />
    <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <span class="text-xs leading-[18px] text-ink-muted">{{ props.footnote }}</span>
      <Button type="submit" variant="marigold" size="sm" :loading="busy"><SendHorizontal aria-hidden="true" />Send</Button>
    </div>
  </form>
</template>
