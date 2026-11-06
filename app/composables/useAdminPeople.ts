import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import type { AdminPerson } from '~/utils/admin'

// Admin › People: accounts matching a name, email or phone (admin_people()), newest first, up to 200;
// blocking and unblocking them
export function useAdminPeople() {
  const supabase = useSupabaseClient()
  const people = ref<AdminPerson[]>([])
  const loading = ref(false)

  async function search(q = '') {
    loading.value = true
    const { data } = await supabase.rpc('admin_people', { q })
    people.value = (data as unknown as AdminPerson[] | null) ?? []
    loading.value = false
  }

  // Block (with a reason the person sees) or unblock; the list refreshes. Returns an error, or null.
  async function block(person: AdminPerson, reason: string, query = ''): Promise<string | null> {
    const { error } = await supabase.rpc('admin_block_person', { target: person.id, reason })
    if (error) return error.message.includes('Staff') ? 'Staff can\'t be blocked.' : error.message.includes('yourself') ? 'You can\'t block yourself.' : error.message.includes('reason') ? 'Give a reason.' : 'That didn\'t work. Try again.'
    await search(query)
    return null
  }
  async function unblock(person: AdminPerson, query = ''): Promise<string | null> {
    const { error } = await supabase.rpc('admin_unblock_person', { target: person.id })
    if (error) return 'That didn\'t work. Try again.'
    await search(query)
    return null
  }

  return { people, loading, search, block, unblock }
}
