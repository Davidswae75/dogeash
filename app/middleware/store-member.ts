// Store dashboard pages: only people who work at a store. Visitors sign in first;
// signed-in buyers without a store are shown how to open one.
export default defineNuxtRouteMiddleware((to) => {
  const { signedIn, hasStore } = useSession()
  if (!signedIn.value) return navigateTo({ path: '/sign-in', query: { redirect: to.fullPath } })
  if (!hasStore.value) return navigateTo('/open-a-store')
})
