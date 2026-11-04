<script setup lang="ts">
import type { StorePermission } from '~/utils/storeRoles'
import { computed } from 'vue'
import { createError, definePageMeta, useRoute, useSeoMeta } from '#imports' // nuxt
import { useStoreContext } from '~/composables/useStoreContext'
import { dashboardSections } from '~/utils/dashboard'

// Dashboard sections that aren't built yet: say what will live here.
// Section names match permission names, so people outside a role see who to ask instead.
definePageMeta({ layout: 'dashboard', middleware: 'store-member' })

const route = useRoute()
const key = String(route.params.section)
const section = dashboardSections[key]
if (!section) throw createError({ statusCode: 404, statusMessage: 'No dashboard section with that name' })

const { can } = useStoreContext()
const allowed = computed(() => can(key as StorePermission))

useSeoMeta({ title: `${section.title} · Store dashboard · Dogeash`, robots: 'noindex' })
</script>

<template>
  <template v-if="section">
    <ComingNext v-if="allowed" :title="section.title" :text="section.text" :plan="section.plan" :back="{ to: '/dashboard', label: 'Back to overview' }" />
    <DashboardNoAccess v-else :title="section.title" />
  </template>
</template>
