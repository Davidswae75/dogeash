<script setup lang="ts">
import { Lock } from '@lucide/vue'
import type { StorePermission } from '~/utils/storeRoles'

// Dashboard sections that aren't built yet: say what will live here.
// Section names match permission names, so people outside a role see who to ask instead.
definePageMeta({ layout: 'dashboard', middleware: 'store-member' })

const route = useRoute()
const key = String(route.params.section)
const section = dashboardSections[key]
if (!section) throw createError({ statusCode: 404, statusMessage: 'No dashboard section with that name' })

const { store, roleLabel, can } = useStoreContext()
const allowed = computed(() => can(key as StorePermission))

useSeoMeta({ title: `${section.title} · Store dashboard · Dogeash`, robots: 'noindex' })
</script>

<template>
  <template v-if="section">
    <ComingNext v-if="allowed" :title="section.title" :text="section.text" :plan="section.plan" :back="{ to: '/dashboard', label: 'Back to overview' }" />
    <div v-else class="flex min-h-[60vh] animate-rise items-center justify-center">
      <div class="flex w-full max-w-[480px] flex-col gap-4 rounded-xl bg-surface p-8 ring-1 ring-line">
        <span class="grid size-11 place-items-center rounded-full bg-ash-soft"><Lock class="size-5" aria-hidden="true" /></span>
        <h1 class="m-0 mega text-[clamp(26px,2.8vw,34px)] leading-none">{{ section.title }} is for the owner</h1>
        <p class="m-0 text-[15px] leading-6 text-ink-muted">
          You're a {{ roleLabel.toLowerCase() }} at {{ store.name }}. Ask the store owner, {{ store.owner.name }}, if you need access.
        </p>
        <Button as-child variant="outline" class="w-fit"><NuxtLink to="/dashboard">Back to overview</NuxtLink></Button>
      </div>
    </div>
  </template>
</template>
