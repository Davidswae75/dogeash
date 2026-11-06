import { ClipboardCheck, Heart, LayoutDashboard, Search, ShieldCheck, Store, Undo2, UserRound } from '@lucide/vue'
import type { AuthLinkCard } from '~/components/auth/AuthLinkCards.vue'
import type { Account } from '~/utils/account'

// Where someone can go straight after signing in, most likely first (the first card is the main one):
//   1. back to what they were doing, if a gated action sent them to sign in
//   2. the admin console (or their inspections), for Dogeash staff
//   3. their store's dashboard, and its public page once it's live, for anyone on a store's team
//   4. browsing dogs, their shortlist and their account, for everyone
// Capped so the screen stays a short choice, not a menu.
const MAX = 5

export function signInNextSteps(o: { redirect?: string, stores: Account['stores'], staffRole: 'admin' | 'inspector' | null }): AuthLinkCard[] {
  const steps: AuthLinkCard[] = []
  if (o.redirect) steps.push({ to: o.redirect, title: 'Carry on where you were', text: 'Back to the page you were on, to finish what you started.', icon: Undo2 })

  if (o.staffRole === 'admin') steps.push({ to: '/admin', title: 'Admin console', text: 'Everything on Dogeash. You\'ll be asked for your one-time code.', icon: ShieldCheck })
  if (o.staffRole === 'inspector') steps.push({ to: '/admin/inspections', title: 'Your inspections', text: 'Visits booked for you. You\'ll be asked for your one-time code.', icon: ClipboardCheck })

  const first = o.stores[0]
  if (first) {
    steps.push({ to: '/dashboard', title: `${first.store.name} dashboard`, text: 'Your dogs, messages, visits and store settings.', icon: LayoutDashboard })
    if (first.store.verified) steps.push({ to: `/stores/${first.store.slug}`, title: 'Your store\'s page', text: 'See your store the way buyers do.', icon: Store })
  }

  steps.push(
    { to: '/dogs', title: 'Find a guard dog', text: 'Browse dogs from inspected kennels by protection level and city.', icon: Search },
    { to: '/account/shortlist', title: 'Your shortlist', text: 'The dogs you\'ve saved, side by side.', icon: Heart },
    { to: '/account', title: 'Your account', text: 'Messages, kennel visits, your dogs\' records and settings.', icon: UserRound },
  )
  // Never the same page twice (a redirect to /dogs, say)
  return steps.filter((s, i) => steps.findIndex(t => t.to === s.to) === i).slice(0, MAX)
}
