import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import { useSession } from './useSession'

// Each of the buyer's dogs' care teams (Supabase: owned_dog_providers): the Dogeash providers they picked for
// that dog, and whether each may add visits to its record. Booking care from the dog's page offers these first.
// Loaded on its own, so My dogs still works if the table isn't there yet. Actions return an error, or null.
export interface CareTeamMember { dogId: string, providerId: string, shareRecord: boolean }

export function useCareTeam() {
  const supabase = useSupabaseClient()
  const { user } = useSession()
  const members = useState<CareTeamMember[]>('care-team', () => [])
  const loaded = useState('care-team-loaded', () => false)

  async function load() {
    if (!user.value) return (members.value = [])
    const { data } = await supabase.from('owned_dog_providers').select('owned_dog_id, share_record, care_providers (public_id)')
    members.value = ((data ?? []) as any[])
      .filter(r => r.care_providers?.public_id)
      .map(r => ({ dogId: r.owned_dog_id, providerId: r.care_providers.public_id, shareRecord: r.share_record }))
    loaded.value = true
  }
  const ensure = () => (loaded.value ? Promise.resolve() : load())
  const teamOf = (dogId: string) => computed(() => members.value.filter(m => m.dogId === dogId))

  const providerUuid = async (publicId: string) =>
    (await supabase.from('care_providers').select('id').eq('public_id', publicId).maybeSingle()).data?.id as string | undefined

  async function add(dogId: string, providerId: string, shareRecord = true): Promise<string | null> {
    const uuid = await providerUuid(providerId)
    if (!uuid) return 'This provider isn\'t on Dogeash right now.'
    const { error } = await supabase.from('owned_dog_providers').insert({ owned_dog_id: dogId, provider_id: uuid, share_record: shareRecord })
    if (error) {
      if (error.code === '23505') return null // already on the team
      return error.message.includes('up to 8') ? 'A dog can have up to 8 care providers.' : error.message.includes('manage this listing') ? 'You manage this listing, so you can\'t add it.' : 'That didn\'t save. Try again.'
    }
    members.value = [...members.value, { dogId, providerId, shareRecord }]
    return null
  }

  async function remove(dogId: string, providerId: string): Promise<string | null> {
    const uuid = await providerUuid(providerId)
    const { error } = await supabase.from('owned_dog_providers').delete().eq('owned_dog_id', dogId).eq('provider_id', uuid ?? '')
    if (error) return 'That didn\'t work. Try again.'
    members.value = members.value.filter(m => !(m.dogId === dogId && m.providerId === providerId))
    return null
  }

  async function setShare(dogId: string, providerId: string, shareRecord: boolean): Promise<string | null> {
    const uuid = await providerUuid(providerId)
    const { error } = await supabase.from('owned_dog_providers').update({ share_record: shareRecord }).eq('owned_dog_id', dogId).eq('provider_id', uuid ?? '')
    if (error) return 'That didn\'t save. Try again.'
    members.value = members.value.map(m => (m.dogId === dogId && m.providerId === providerId ? { ...m, shareRecord } : m))
    return null
  }

  return { members, loaded, load, ensure, teamOf, add, remove, setShare }
}
