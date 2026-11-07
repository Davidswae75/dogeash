import { defineNuxtRouteMiddleware, navigateTo } from '#imports' // nuxt
import { useSession } from '~/composables/useSession'

// Provider dashboard pages: only people who manage a care listing. Visitors sign in first; anyone else
// goes to the care directory (listings are added by Dogeash, which invites the provider).
export default defineNuxtRouteMiddleware((to) => {
  const { signedIn, providers } = useSession()
  if (!signedIn.value) return navigateTo({ path: '/sign-in', query: { redirect: to.fullPath } })
  if (!providers.value.length) return navigateTo('/care')
})
