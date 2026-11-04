<script setup lang="ts">
import { ref } from 'vue'
import type { Store } from '~/utils/stores'

// Closing the store. A draft store (not yet sent for inspection) can be deleted here, after asking;
// a store further along is closed by Dogeash, so this says how to ask. `remove` returns an error or null.
const props = defineProps<{ store: Store, remove: () => Promise<string | null> }>()
const asking = ref(false)
const busy = ref(false)
const error = ref('')
async function confirm() {
  busy.value = true
  error.value = (await props.remove()) ?? ''
  busy.value = false
  if (error.value) asking.value = false
}
</script>

<template>
  <section class="flex flex-col gap-3 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6" aria-labelledby="close-store">
    <h2 id="close-store" class="m-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">Close your store</h2>
    <template v-if="props.store.status === 'draft'">
      <p class="m-0 text-[13px] leading-5 text-ink-muted">{{ props.store.name }} is still a draft, so you can delete it. Its team and settings go with it. Delete its dogs first.</p>
      <Button variant="outline" size="sm" class="w-fit" @click="asking = true">Delete this store</Button>
    </template>
    <p v-else class="m-0 text-[13px] leading-5 text-ink-muted">
      Buyers have seen {{ props.store.name }}, so Dogeash closes it with you: visits, messages and any deposits are settled first. To close or hand over your store, contact Dogeash. To take a break, pause visit requests above.
    </p>
    <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>

    <AlertDialog v-model:open="asking">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {{ props.store.name }}?</AlertDialogTitle>
          <AlertDialogDescription>This can't be undone. The store, its team and its settings are deleted.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <Button :loading="busy" @click="confirm">Delete the store</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>
</template>
