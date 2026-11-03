import { useSupabaseClient } from '#imports' // @nuxtjs/supabase
import { initialsOf } from '~/utils/account'

// Store data in Supabase. Creating a store makes the signed-in person its owner (a database
// trigger does that); it starts as a draft and stays hidden until Dogeash verifies it.
const randomCode = (length: number) => Array.from({ length }, () => '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 32)]).join('')

const slugify = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'store'

export function useStoreApi() {
  const supabase = useSupabaseClient()

  return {
    // Returns an error message, or null when the store was created
    async createDraftStore(name: string, city: string): Promise<string | null> {
      const { error } = await supabase.from('stores').insert({
        public_id: `STR-${randomCode(6)}`,
        slug: `${slugify(name)}-${randomCode(4).toLowerCase()}`,
        name: name.trim(),
        initials: initialsOf(name),
        city: city.trim(),
      })
      return error ? 'Your account is ready, but the store couldn\'t be saved. You can add it from Open a store.' : null
    },
  }
}
