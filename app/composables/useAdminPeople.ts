import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import type { AdminPerson } from '~/utils/admin'

// Admin › People: accounts matching a name, email or phone (admin_people()), newest first, up to 200
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

  return { people, loading, search }
}
