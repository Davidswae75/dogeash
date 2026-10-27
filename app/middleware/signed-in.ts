// Pages that need an account: send visitors to sign in, then back to where they were going
export default defineNuxtRouteMiddleware((to) => {
  const { signedIn } = useSession()
  if (!signedIn.value) return navigateTo({ path: '/sign-in', query: { redirect: to.fullPath } })
})
