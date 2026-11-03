import { useState, useSupabaseClient } from '#imports'
import type { SearchFilters } from '~/utils/searchFilters'
import { describeFilters, emptyFilters, sameFilters } from '~/utils/searchFilters'
import { useSession } from './useSession'

// The signed-in person's saved searches (Supabase: saved_searches). Loaded with the account;
// each change returns an error message, or null when it worked.
export interface SavedSearch { id: string, label: string, filters: SearchFilters, alerts: boolean }

export function useSavedSearches() {
  const supabase = useSupabaseClient()
  const { user } = useSession()
  const searches = useState<SavedSearch[]>('saved-searches', () => [])

  async function load() {
    if (!user.value) return (searches.value = [])
    const { data } = await supabase.from('saved_searches').select('id, label, filters, alerts').order('created_at', { ascending: false })
    searches.value = (data ?? []).map(r => ({ id: r.id, label: r.label, alerts: r.alerts, filters: { ...emptyFilters(), ...(r.filters as Partial<SearchFilters>) } }))
  }

  const find = (filters: SearchFilters) => searches.value.find(s => sameFilters(s.filters, filters))

  async function add(filters: SearchFilters): Promise<string | null> {
    if (find(filters)) return null
    const label = describeFilters(filters)
    const { data, error } = await supabase.from('saved_searches').insert({ label, filters: { ...filters } }).select('id').single()
    if (error) return error.message.includes('20 saved searches') ? 'You can keep up to 20 saved searches. Remove one first.' : 'That search didn\'t save. Try again.'
    searches.value = [{ id: data.id, label, filters, alerts: true }, ...searches.value]
    return null
  }

  async function setAlerts(id: string, alerts: boolean): Promise<string | null> {
    const { error } = await supabase.from('saved_searches').update({ alerts }).eq('id', id)
    if (error) return 'That didn\'t save. Try again.'
    searches.value = searches.value.map(s => (s.id === id ? { ...s, alerts } : s))
    return null
  }

  async function remove(id: string): Promise<string | null> {
    const { error } = await supabase.from('saved_searches').delete().eq('id', id)
    if (error) return 'That search couldn\'t be removed. Try again.'
    searches.value = searches.value.filter(s => s.id !== id)
    return null
  }

  return { searches, load, find, add, setAlerts, remove }
}
