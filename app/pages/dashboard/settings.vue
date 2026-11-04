<script setup lang="ts">
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useStoreContext } from '~/composables/useStoreContext'
import { useStoreProfile } from '~/composables/useStoreProfile'
import { visitSettings } from '~/utils/stores'

// Store settings for the owner: when the store takes kennel visits (or pausing them), and closing the store
definePageMeta({ layout: 'dashboard', title: 'Settings', middleware: 'store-member' })
useSeoMeta({ title: 'Settings · Store dashboard · Dogeash', robots: 'noindex' })

const { membership, store, can } = useStoreContext()
const { saveVisits, deleteDraft } = useStoreProfile()
</script>

<template>
  <DashboardNoAccess v-if="!can('settings')" title="Settings" />
  <div v-else-if="membership" class="flex max-w-[860px] flex-col gap-5">
    <DashboardVisitSettings :key="store.id" :settings="visitSettings(store)" :save="saveVisits" />
    <DashboardCloseStore :store="store" :remove="deleteDraft" />
  </div>
</template>
