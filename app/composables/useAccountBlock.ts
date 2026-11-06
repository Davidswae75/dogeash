import { useState, useSupabaseClient } from '#imports'
import { useSession } from './useSession'

// Whether Dogeash has blocked the signed-in account, and why (Supabase: my_block()). A blocked account
// can still sign in and read, but the database refuses everything it tries to add or change.
export function useAccountBlock() {
  const supabase = useSupabaseClient()
  const { user } = useSession()
  const block = useState<{ reason: string, blocked_at: string } | null>('account-block', () => null)

  async function load() {
    if (!user.value) return (block.value = null)
    const { data } = await supabase.rpc('my_block')
    block.value = (data as unknown as typeof block.value) ?? null
  }

  return { block, load }
}
