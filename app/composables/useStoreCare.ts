import { computed } from 'vue'
import { useSupabaseClient } from '#imports'
import type { CareProvider } from '~/utils/care'
import { findCareProvider } from '~/utils/care'
import { useNotify } from './useNotify'
import { useStoreContext } from './useStoreContext'
import { useStoreProfile } from './useStoreProfile'

// The care team of the store the dashboard is showing (Supabase: store_care_links): the providers from the
// care directory it works with, and what each does for it. Owners and managers change it; up to 12.
// Each change returns an error message, or null when it worked.
export const CARE_TEAM_MAX = 12

export function useStoreCare() {
  const supabase = useSupabaseClient()
  const { store, storeUuid } = useStoreContext()
  const { reload } = useStoreProfile()

  const team = computed(() => store.value.care.flatMap((link) => {
    const provider = findCareProvider(link.providerId)
    return provider ? [{ provider, relationship: link.relationship }] : []
  }))
  const linked = (provider: CareProvider) => store.value.care.some(c => c.providerId === provider.id)

  // Store and provider database ids, for writing a link
  async function ids(provider: CareProvider) {
    const [storeId, { data }] = await Promise.all([storeUuid(), supabase.from('care_providers').select('id').eq('public_id', provider.id).maybeSingle()])
    return storeId && data ? { store_id: storeId, provider_id: data.id } : null
  }

  async function add(provider: CareProvider, relationship: string): Promise<string | null> {
    const key = await ids(provider)
    if (!key) return 'That provider wasn\'t found. Refresh the page and try again.'
    const { error } = await supabase.from('store_care_links').insert({ ...key, relationship: relationship.trim() })
    if (error) return error.message.includes('up to 12') ? `A store can link up to ${CARE_TEAM_MAX} providers. Remove one first.` : error.code === '23505' ? 'They\'re already on your care team.' : 'That didn\'t save. Try again.'
    await reload()
    useNotify().careUpdated(`${provider.name} added`, 'Buyers see them on your store page.')
    return null
  }

  async function rename(provider: CareProvider, relationship: string): Promise<string | null> {
    const key = await ids(provider)
    if (!key) return 'That provider wasn\'t found. Refresh the page and try again.'
    const { data, error } = await supabase.from('store_care_links').update({ relationship: relationship.trim() }).match(key).select('relationship')
    if (error || !data?.length) return 'That didn\'t save. Try again.'
    await reload()
    useNotify().careUpdated('Saved', `${provider.name}: "${relationship.trim()}"`)
    return null
  }

  async function remove(provider: CareProvider) {
    const key = await ids(provider)
    const { data, error } = key ? await supabase.from('store_care_links').delete().match(key).select('provider_id') : { data: null, error: true }
    if (error || !data?.length) return void useNotify().failed('That didn\'t work. Try again.')
    await reload()
    useNotify().careUpdated(`${provider.name} removed`, 'They no longer show on your store page.')
  }

  return { team, linked, add, rename, remove }
}
