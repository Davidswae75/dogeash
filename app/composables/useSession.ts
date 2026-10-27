import type { Account } from '~/utils/account'
import type { StorePermission } from '~/utils/storeRoles'

// Who is signed in. A sample session in a cookie (so the server renders the right header)
// until accounts are connected; signing in merges the guest's saved dogs into the account.
const THIRTY_DAYS = 60 * 60 * 24 * 30

export function useSession() {
  const cookie = useCookie<Account | null>('dogeash-session', { default: () => null, maxAge: THIRTY_DAYS, sameSite: 'lax' })
  const user = useState<Account | null>('session-user', () => cookie.value)

  const signedIn = computed(() => !!user.value)
  const firstName = computed(() => (user.value ? firstNameOf(user.value.name) : ''))
  const initials = computed(() => (user.value ? initialsOf(user.value.name) : ''))

  // Stores this person works at, with the store itself; empty for buyers only
  const memberships = computed(() => (user.value?.stores ?? [])
    .map(m => ({ ...m, store: getStore(m.storeId)! }))
    .filter(m => m.store))
  const hasStore = computed(() => memberships.value.length > 0)
  const memberOf = (storeId: string) => memberships.value.find(m => m.storeId === storeId)
  const can = (storeId: string, permission: StorePermission) => {
    const m = memberOf(storeId)
    return !!m && roleCan(m.role, permission)
  }

  // Returns how many shortlisted dogs moved from this browser into the account
  function signIn(details: Partial<Account> = {}) {
    const account = { ...sampleAccount, ...details }
    const moved = import.meta.client ? mergeGuestLists(account.id) : 0
    user.value = cookie.value = account
    return moved
  }

  // Saved dogs stay with the account; this browser goes back to the guest's (empty) lists
  function signOut() {
    user.value = cookie.value = null
    useNotify().signedOut()
    return navigateTo('/')
  }

  return { user, signedIn, firstName, initials, memberships, hasStore, memberOf, can, signIn, signOut }
}
