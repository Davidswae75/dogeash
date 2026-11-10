import { defineNuxtRouteMiddleware, useNuxtApp } from '#imports' // nuxt
import { useCatalog } from '~/composables/useCatalog'

// Leaving the store dashboard, the provider dashboard or admin for the public site: read the catalogue again first, so a store
// page or listing shows what was just saved, published or approved (not what the page load started with)
const backOffice = (path: string) => path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/provider')

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server || useNuxtApp().isHydrating) return
  if (backOffice(from.path) && !backOffice(to.path)) await useCatalog().load(true)
})
