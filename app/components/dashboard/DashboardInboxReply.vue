<script setup lang="ts">
import { SendHorizontal } from '@lucide/vue'
import type { InboxItem } from '~/utils/inbox'

// Reply box under a buyer message: quick replies, who it's sent as, and how the buyer will hear about it
const props = defineProps<{ item: InboxItem }>()
const emit = defineEmits<{ send: [text: string] }>()
const { store } = useStoreContext()

const text = ref('')
const error = ref('')
watch(() => props.item.id, () => { text.value = error.value = '' })
watch(text, () => { error.value = '' })

function send() {
  if (text.value.trim().length < 2) return (error.value = 'Write a reply first.')
  emit('send', text.value.trim())
  text.value = ''
}
</script>

<template>
  <form class="flex flex-col gap-3 border-t border-line p-4" @submit.prevent="send">
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="q in quickReplies"
        :key="q"
        type="button"
        class="cursor-pointer rounded-full border-[1.5px] border-line-strong bg-transparent px-2.5 py-1 text-xs font-semibold text-ink hover:border-ink"
        @click="text = q"
      >{{ q }}</button>
    </div>
    <label :for="`reply-${props.item.id}`" class="sr-only">Reply to {{ props.item.from }}</label>
    <Textarea
      :id="`reply-${props.item.id}`"
      v-model="text"
      rows="3"
      :placeholder="`Reply to ${props.item.from}`"
      class="border-line-strong"
      @keydown.meta.enter="send"
      @keydown.ctrl.enter="send"
    />
    <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <span class="text-xs leading-[18px] text-ink-muted">
        Sending as <strong class="text-ink">{{ store.name }}</strong>. Saved in Dogeash<template v-if="props.item.channels?.length">; {{ props.item.from }} also gets it by {{ props.item.channels.map(c => channelLabels[c]).join(' and ') }}</template>.
      </span>
      <Button type="submit" variant="marigold" size="sm"><SendHorizontal aria-hidden="true" />Send reply</Button>
    </div>
  </form>
</template>
