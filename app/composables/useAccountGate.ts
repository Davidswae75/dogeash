// Actions that need an account (contacting a store, booking a visit or care, reserving).
// Browsing, saving and comparing stay free. A gated button calls `guard()`:
//  - signed in: the action runs straight away
//  - signed out: the sign-in dialog opens, saying what the action was and why it needs an account.
// Signing in from the dialog returns to the same page with `?resume=<key>`, and the action reopens by itself.

export interface AccountGate {
  /** Unique per action and target, e.g. `visit:STR-001` */
  key: string
  /** "book a visit with K9 Guardian Kennels" — completes "Sign in to …" */
  action: string
  /** One line on why this needs an account */
  reason: string
}

// The dialog's state, shared with the one <AccountGateDialog> in the layouts
export const useAccountGateDialog = () => useState<AccountGate | null>('account-gate', () => null)

export function useAccountGate(gate: MaybeRefOrGetter<AccountGate>, run: () => void) {
  const { signedIn } = useSession()
  const dialog = useAccountGateDialog()
  const route = useRoute()
  const router = useRouter()

  function guard() {
    if (signedIn.value) run()
    else dialog.value = toValue(gate)
  }

  // Back from signing in: pick up the action and tidy the address bar
  onMounted(() => {
    if (!signedIn.value || route.query.resume !== toValue(gate).key) return
    const { resume: _, ...query } = route.query
    router.replace({ query })
    run()
  })

  return { guard }
}

// Where the dialog's buttons send people, with the way back and the action to resume
export function accountGateLinks(gate: AccountGate, path: string) {
  const [pathname = '/', search = ''] = path.split('?')
  const params = new URLSearchParams(search)
  params.set('resume', gate.key)
  const redirect = `${pathname}?${params}`
  return {
    signIn: { path: '/sign-in', query: { redirect } },
    signUp: { path: '/sign-up', query: { redirect } },
  }
}
