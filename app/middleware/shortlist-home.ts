import { defineNuxtRouteMiddleware, navigateTo } from '#imports' // nuxt
import { useSession } from '~/composables/useSession'

// Signed-in people keep their shortlist in the account area, so /shortlist and its compare page send them there
export default defineNuxtRouteMiddleware((to) => {
  if (useSession().signedIn.value) return navigateTo(`/account${to.path}`, { replace: true })
})
