import { useSupabaseClient } from '#imports'
import type { Database } from '~/types/database.types'
import { useSession } from './useSession'

// Saving the signed-in person's profile (details, home profile, contact preferences).
// Returns an error message, or null when saved; the account is reloaded so every page sees the change.
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export function useProfile() {
  const supabase = useSupabaseClient()
  const session = useSession()

  async function save(patch: ProfileUpdate): Promise<string | null> {
    const id = session.user.value?.id
    if (!id) return 'You\'re signed out. Sign in again to save.'
    const { error } = await supabase.from('profiles').update(patch).eq('id', id)
    if (error) return error.code === '23514' ? 'Check the details: one of them isn\'t in the right format.' : 'That didn\'t save. Check your connection and try again.'
    await session.load()
    return null
  }

  return { save }
}
