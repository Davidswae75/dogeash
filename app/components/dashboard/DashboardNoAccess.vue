<script setup lang="ts">
import { Lock } from '@lucide/vue'
import { useStoreContext } from '~/composables/useStoreContext'

// Shown in place of a dashboard section this person's role doesn't cover: who they are here, and who to ask
const props = defineProps<{ title: string }>()
const { store, roleLabel } = useStoreContext()
</script>

<template>
  <div class="flex min-h-[60vh] animate-rise items-center justify-center">
    <div class="flex w-full max-w-[480px] flex-col gap-4 rounded-xl bg-surface p-8 ring-1 ring-line">
      <span class="grid size-11 place-items-center rounded-full bg-ash-soft"><Lock class="size-5" aria-hidden="true" /></span>
      <h1 class="m-0 mega text-[clamp(26px,2.8vw,34px)] leading-none">{{ props.title }} isn't part of your role</h1>
      <p class="m-0 text-[15px] leading-6 text-ink-muted">
        You're a {{ roleLabel.toLowerCase() }} at {{ store.name }}. Ask the store owner, {{ store.owner.name }}, if you need access.
      </p>
      <Button as-child variant="outline" class="w-fit"><NuxtLink to="/dashboard">Back to overview</NuxtLink></Button>
    </div>
  </div>
</template>
