import { useState, useSupabaseClient } from '#imports'
import type { AdminDog, DogStatus } from '~/utils/admin'
import { useAdmin } from './useAdmin'

// Admin › Listings: every dog in any status (admin_dogs()), and moving one on (admin_set_dog_status())
export function useAdminListings() {
  const supabase = useSupabaseClient()
  const dogs = useState<AdminDog[]>('admin-dogs', () => [])
  const loaded = useState('admin-dogs-loaded', () => false)

  async function load() {
    const { data } = await supabase.rpc('admin_dogs')
    dogs.value = (data as unknown as AdminDog[] | null) ?? []
    loaded.value = true
  }

  // Returns an error message, or null when done (the list and the overview's counts reload)
  async function setStatus(dog: AdminDog, next: DogStatus, note: string): Promise<string | null> {
    const { error } = await supabase.rpc('admin_set_dog_status', { target: dog.id, next, note })
    if (error) return error.message.includes('reason') ? 'Give the store a reason.' : error.message.includes('verified') ? 'Its store isn\'t verified, so the dog can\'t go live.' : 'That didn\'t work. Try again.'
    await Promise.all([load(), useAdmin().loadOverview()])
    return null
  }

  return { dogs, loaded, load, setStatus }
}
