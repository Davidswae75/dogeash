import { useState, useSupabaseClient } from '#imports'
import type { StoreRole } from '~/utils/storeRoles'
import { useNotify } from './useNotify'
import { useSession } from './useSession'

// Invitations to join a store's team that are waiting for the signed-in person, matched by their email
// (Supabase: my_store_invites(), accept_store_invite()). Joining adds the store to their account.
export interface StoreInvite { id: string, storeName: string, storeCity: string, role: StoreRole, invitedBy: string, createdAt: string }

export function useStoreInvites() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const invites = useState<StoreInvite[]>('my-store-invites', () => [])

  async function load() {
    if (!session.user.value) return (invites.value = [])
    const { data } = await supabase.rpc('my_store_invites')
    invites.value = (data ?? []).map(i => ({ id: i.id, storeName: i.store_name, storeCity: i.store_city, role: i.role, invitedBy: i.invited_by_name, createdAt: i.created_at }))
  }

  // Returns an error message, or null once they're on the team
  async function accept(invite: StoreInvite): Promise<string | null> {
    const { error } = await supabase.rpc('accept_store_invite', { target: invite.id })
    if (error) return 'That invitation was withdrawn or has already been used.'
    invites.value = invites.value.filter(i => i.id !== invite.id)
    await session.load()
    useNotify().teamUpdated(`You joined ${invite.storeName}`, 'Your store dashboard is ready. You can switch to it from your account menu.')
    return null
  }

  async function decline(invite: StoreInvite) {
    await supabase.from('store_invites').delete().eq('id', invite.id)
    invites.value = invites.value.filter(i => i.id !== invite.id)
  }

  return { invites, load, accept, decline }
}
