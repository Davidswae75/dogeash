import { computed } from 'vue'
import { navigateTo, useCookie } from '#imports' // nuxt
import { useSession } from './useSession'

// Someone who manages a care listing uses Dogeash two ways: as the provider (their dashboard, bookings and
// listing) or as a buyer (My Dogeash, shortlist, their own dogs). The mode they're in decides what the account
// menu shows; they switch with one click. It's remembered on this device; providers start as providers.
export type AccountMode = 'provider' | 'buyer'

export function useAccountMode() {
  const { providers } = useSession()
  const saved = useCookie<AccountMode | null>('dogeash-mode', { default: () => null, maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  const isProvider = computed(() => providers.value.length > 0)
  const mode = computed<AccountMode>(() => (isProvider.value ? saved.value ?? 'provider' : 'buyer'))

  async function switchTo(to: AccountMode) {
    saved.value = to
    await navigateTo(to === 'provider' ? '/provider' : '/account')
  }
  // Opening the provider dashboard puts them in provider mode
  const enterProvider = () => { if (isProvider.value) saved.value = 'provider' }

  return { mode, isProvider, switchTo, enterProvider }
}
