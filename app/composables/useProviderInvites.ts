import { useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { CareType } from '~/utils/care'
import { useNotify } from './useNotify'
import { useSession } from './useSession'

// Dogeash's invitations to manage a care listing (a vet's, a trainer's) waiting for the signed-in person,
// matched by their email (Supabase: my_provider_invites(), accept_provider_invite()).
export interface ProviderInvite { id: string, providerName: string, providerType: CareType, providerCity: string, createdAt: string }

export function useProviderInvites() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const invites = useState<ProviderInvite[]>('my-provider-invites', () => [])

  async function load() {
    if (!session.user.value) return (invites.value = [])
    const { data } = await supabase.rpc('my_provider_invites')
    invites.value = (data ?? []).map(i => ({ id: i.id, providerName: i.provider_name, providerType: i.provider_type, providerCity: i.provider_city, createdAt: i.created_at }))
  }

  // Returns an error message, or null once they manage the listing
  async function accept(invite: ProviderInvite): Promise<string | null> {
    const { error } = await supabase.rpc('accept_provider_invite', { target: invite.id })
    if (error) return 'That invitation was withdrawn or has already been used.'
    invites.value = invites.value.filter(i => i.id !== invite.id)
    await session.load()
    useNotify().teamUpdated(`You manage ${invite.providerName}`, 'Your provider dashboard is ready: bookings and your listing.')
    return null
  }

  async function decline(invite: ProviderInvite) {
    await supabase.from('care_provider_invites').delete().eq('id', invite.id)
    invites.value = invites.value.filter(i => i.id !== invite.id)
  }

  return { invites, load, accept, decline }
}
