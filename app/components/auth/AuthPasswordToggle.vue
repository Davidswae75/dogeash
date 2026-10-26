<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'

// Show/hide button for a password field's append-icon slot
const visible = defineModel<boolean>({ default: false })
</script>

<template>
  <button
    type="button"
    class="grid size-9 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-ink-muted hover:text-ink"
    :aria-label="visible ? 'Hide password' : 'Show password'"
    :aria-pressed="visible"
    @click="visible = !visible"
  >
    <component :is="visible ? EyeOff : Eye" class="size-5" aria-hidden="true" />
  </button>
</template>
