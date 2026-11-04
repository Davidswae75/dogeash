<script setup lang="ts">
import { Star } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import type { Review, ReviewValues } from '~/utils/reviews'
import { ratingWords, reviewSchema } from '~/utils/reviews'

// Write or edit a review of a store: stars and a few honest sentences. `save` returns an error or null;
// `remove` (when editing) deletes it after asking.
const props = defineProps<{ storeName: string, existing?: Review, save: (values: ReviewValues) => Promise<string | null>, remove?: () => Promise<void> }>()
const open = defineModel<boolean>('open', { default: false })

const { handleSubmit, defineField, errors, resetForm } = useForm<ReviewValues>({ validationSchema: toTypedSchema(reviewSchema) })
const [rating] = defineField('rating')
const [text] = defineField('text')
const ratingText = computed({ get: () => (rating.value ? String(rating.value) : ''), set: (v) => { if (v) rating.value = Number(v) } })

// Each time it opens, start from the existing review (or blank)
watch(open, (o) => {
  if (!o) return
  resetForm({ values: props.existing ? { rating: props.existing.rating, text: props.existing.text } : { rating: undefined, text: '' } })
  error.value = ''
  confirming.value = false
})

const busy = ref(false)
const error = ref('')
const confirming = ref(false)
const submit = handleSubmit(async (values) => {
  busy.value = true
  error.value = (await props.save(values)) ?? ''
  busy.value = false
  if (!error.value) open.value = false
})
async function remove() {
  busy.value = true
  await props.remove?.()
  busy.value = false
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>{{ props.existing ? 'Edit your review' : 'Review' }} {{ props.storeName }}</DialogTitle>
        <DialogDescription>How was your visit? Other buyers read this before they choose a kennel. Keep it to what you saw and how you were treated.</DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
        <FieldShell label="Your rating" :error="errors.rating">
          <div class="flex flex-wrap items-center gap-3">
            <ToggleGroup v-model="ratingText" type="single" aria-label="Your rating, 1 to 5 stars" class="flex gap-1">
              <ToggleGroupItem v-for="n in 5" :key="n" :value="String(n)" :aria-label="`${n} ${n === 1 ? 'star' : 'stars'}`" class="size-10 rounded-full! p-0">
                <Star :class="['size-6', rating && n <= rating ? 'fill-marigold text-marigold' : 'text-line-strong']" aria-hidden="true" />
              </ToggleGroupItem>
            </ToggleGroup>
            <span v-if="rating" class="text-sm font-semibold">{{ ratingWords[rating] }}</span>
          </div>
        </FieldShell>
        <FieldShell label="Your review" for="review-text" hint="The dogs, the kennel, the advice you got. At least a sentence." :error="errors.text">
          <Textarea id="review-text" v-model="text" rows="5" maxlength="1000" class="border-2 border-line-strong" />
        </FieldShell>
        <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>

        <DialogFooter class="flex-wrap gap-2 sm:justify-between">
          <template v-if="props.existing && props.remove">
            <Button v-if="!confirming" type="button" variant="ghost" :disabled="busy" @click="confirming = true">Delete review</Button>
            <Button v-else type="button" variant="outline" :loading="busy" @click="remove">Yes, delete it</Button>
          </template>
          <span v-else />
          <Button type="submit" variant="marigold" :loading="busy">{{ props.existing ? 'Save changes' : 'Post review' }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
