<script setup lang="ts">
import { MessageSquare } from '@lucide/vue'
import type { Dog } from '~/utils/dogs'
import type { Store } from '~/utils/stores'

// Message a store, optionally about one dog. Needs an account (signed-out visitors get the sign-in dialog first).
// Messaging isn't connected yet, so sending shows a preview and a toast.
const props = withDefaults(defineProps<{
  store: Store
  dog?: Dog
  label?: string
  variant?: 'marigold' | 'default' | 'outline' | 'ghost' | 'night'
  size?: 'default' | 'sm'
  triggerClass?: string
}>(), { label: 'Contact store', variant: 'marigold', size: 'default' })

const open = ref(false)
const message = ref('')
const error = ref('')
const notify = useNotify()

const { guard } = useAccountGate(() => ({
  key: `contact:${props.store.id}${props.dog ? `:${props.dog.fileNo}` : ''}`,
  action: `message ${props.store.name}`,
  reason: 'Stores reply to a name they can see, so you need an account to message them. They\'ll answer here and by email or SMS.',
}), () => { open.value = true })

const prompts = computed(() => props.dog
  ? [`Is ${props.dog.name} still available?`, `Can I visit to meet ${props.dog.name} this week?`, `How is ${props.dog.name} with children and visitors?`]
  : ['Which of your dogs would suit a family compound?', 'Can I visit the kennel this week?', 'Do you deliver and train at the buyer\'s home?'])

function send() {
  if (message.value.trim().length < 10) return (error.value = 'Write a little more so the store knows what you need.')
  notify.messageSent(props.store.name, props.store.replies)
  open.value = false
}

watch(open, (isOpen) => {
  if (!isOpen) message.value = error.value = ''
})
watch(message, () => { error.value = '' })
</script>

<template>
  <Button :variant="props.variant" :size="props.size" :class="props.triggerClass" @click="guard">
    <slot>{{ props.label }}</slot>
  </Button>

  <Dialog v-model:open="open">
    <DialogContent class="border-line bg-surface sm:max-w-[500px]">
      <DialogHeader class="text-left">
        <span class="flex items-center gap-2 font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">
          <MessageSquare class="size-3.5" aria-hidden="true" />Message · replies in {{ props.store.replies }}
        </span>
        <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">{{ props.store.name }}</DialogTitle>
        <DialogDescription class="text-ink-muted">
          <template v-if="props.dog">About {{ props.dog.name }}, {{ props.dog.breed }} · <span class="font-mono">{{ props.dog.fileNo }}</span></template>
          <template v-else>{{ props.store.area }}, {{ props.store.city }}</template>
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit.prevent="send">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in prompts"
            :key="p"
            type="button"
            class="cursor-pointer rounded-full border-[1.5px] border-line-strong bg-transparent px-3 py-1.5 text-left text-[13px] font-semibold text-ink hover:border-ink"
            @click="message = p"
          >{{ p }}</button>
        </div>
        <label for="contact-message" class="sr-only">Your message</label>
        <Textarea id="contact-message" v-model="message" rows="4" placeholder="Write your message" class="border-line-strong" />
        <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
        <DialogFooter class="flex-col gap-3 sm:flex-col">
          <Button type="submit" variant="marigold" class="w-full">Send message</Button>
          <p class="m-0 text-center text-xs text-ink-muted">Preview: messages aren't sent yet. Your phone number is never shown to the store.</p>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
