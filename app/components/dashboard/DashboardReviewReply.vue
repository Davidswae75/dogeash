<script setup lang="ts">
import { ref } from 'vue'
import type { Review } from '~/utils/reviews'

// The store's reply under a review: a button to start, then a box to write, change or remove it.
// `reply` saves (empty text removes) and returns an error or null.
const props = defineProps<{ review: Review, reply: (text: string) => Promise<string | null> }>()

const editing = ref(false)
const text = ref('')
const busy = ref(false)
const error = ref('')

function start() {
  text.value = props.review.reply ?? ''
  error.value = ''
  editing.value = true
}
async function save(value: string) {
  busy.value = true
  error.value = (await props.reply(value)) ?? ''
  busy.value = false
  if (!error.value) editing.value = false
}
</script>

<template>
  <div v-if="editing" class="flex w-full flex-col gap-2">
    <label :for="`reply-${props.review.id}`" class="text-sm font-semibold">Your reply <span class="font-normal text-ink-muted">(everyone reading your reviews sees it)</span></label>
    <Textarea :id="`reply-${props.review.id}`" v-model="text" rows="3" maxlength="1000" placeholder="Thank them, or answer a concern calmly and specifically." class="border-line-strong" />
    <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
    <div class="flex flex-wrap gap-2">
      <Button variant="marigold" size="sm" :loading="busy" :disabled="!text.trim()" @click="save(text)">{{ props.review.reply ? 'Save reply' : 'Post reply' }}</Button>
      <Button variant="ghost" size="sm" :disabled="busy" @click="editing = false">Cancel</Button>
      <Button v-if="props.review.reply" variant="ghost" size="sm" :disabled="busy" class="ml-auto" @click="save('')">Remove reply</Button>
    </div>
  </div>
  <Button v-else variant="outline" size="sm" @click="start">{{ props.review.reply ? 'Edit reply' : 'Reply' }}</Button>
</template>
