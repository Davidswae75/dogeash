import type { AuthPanelMeta } from '~/types/page-meta'

// Lets an auth page swap its side panel while it's open (sign-up shows a store panel for "Open a store").
// The auth layout uses this when set, otherwise the page's definePageMeta authPanel. Cleared when the page leaves.
export function useAuthPanel(panel?: MaybeRefOrGetter<AuthPanelMeta | undefined>) {
  const override = useState<AuthPanelMeta | undefined>('auth-panel-override', () => undefined)
  if (panel !== undefined) {
    watchEffect(() => { override.value = toValue(panel) })
    onBeforeUnmount(() => { override.value = undefined })
  }
  return override
}
