import { computed } from 'vue'
import { useSession } from './useSession'

// Where the shortlist lives: inside the account area when signed in (so people stay in their
// dashboard), the public page for guests. /shortlist also redirects signed-in people, so old links work.
export function useShortlistRoutes() {
  const { signedIn } = useSession()
  return {
    list: computed(() => (signedIn.value ? '/account/shortlist' : '/shortlist')),
    compare: computed(() => (signedIn.value ? '/account/shortlist/compare' : '/shortlist/compare')),
  }
}
