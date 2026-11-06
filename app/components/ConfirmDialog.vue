<script setup lang="ts">
import { ref, watch } from 'vue'

// "Are you sure?" for something that can't be undone (removing a dog, deleting a review).
// `run` does it and returns an error to show, or null to close.
const props = defineProps<{ title: string, description: string, confirmLabel: string, run: () => Promise<string | null> }>()
const open = defineModel<boolean>('open', { default: false })
const busy = ref(false)
const error = ref('')
watch(open, (o) => { if (o) error.value = '' })

async function confirm() {
  busy.value = true
  error.value = (await props.run()) ?? ''
  busy.value = false
  if (!error.value) open.value = false
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent class="sm:max-w-[440px]">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ props.title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ props.description }}</AlertDialogDescription>
      </AlertDialogHeader>
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="busy">Cancel</AlertDialogCancel>
        <!-- A plain button, so the dialog stays open while it works and shows any error -->
        <Button class="bg-danger text-white hover:bg-danger/90" :loading="busy" @click="confirm">{{ props.confirmLabel }}</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
