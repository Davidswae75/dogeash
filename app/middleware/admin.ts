import { createError, defineNuxtRouteMiddleware, navigateTo } from '#imports' // nuxt
import { useSession } from '~/composables/useSession'
import { useStaff } from '~/composables/useStaff'

// Admin pages: signed in, on the staff list, and past a one-time code (the code page itself excepted).
// Anyone not on the staff list gets a plain "not found", so the admin dashboard doesn't advertise itself.
// The database checks all of this again on every admin call; this only decides which page to show.
export default defineNuxtRouteMiddleware(async (to) => {
  const { signedIn } = useSession()
  if (!signedIn.value) return navigateTo({ path: '/sign-in', query: { redirect: to.fullPath } })
  const staff = useStaff()
  if (!staff.loaded.value) await staff.load()
  if (!staff.role.value) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  if (to.path === '/admin/verify') return
  if (!(await staff.hasCode())) return navigateTo({ path: '/admin/verify', query: { redirect: to.fullPath } })
})
