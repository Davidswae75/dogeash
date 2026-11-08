import { useState, useSupabaseClient } from '#imports'
import type { StoreRole } from '~/utils/storeRoles'
import { storeRoles } from '~/utils/storeRoles'
import { useNotify } from './useNotify'
import { useSession } from './useSession'
import { useStoreContext } from './useStoreContext'

// The team of the store the dashboard is showing (Supabase: store_members, store_invites, store_team()).
// Everyone on the team can see it; owners invite, withdraw invitations, change roles and remove people,
// and the database keeps at least one owner. Each change returns an error message, or null when it worked.
export interface TeamMember { userId: string, name: string, email: string | null, role: StoreRole, joinedAt: string }
export interface TeamInvite { id: string, email: string, role: StoreRole, createdAt: string }

export function useStoreTeam() {
  const supabase = useSupabaseClient()
  const { user, load: reloadSession } = useSession()
  const { storeUuid } = useStoreContext()
  const members = useState<TeamMember[]>('store-team', () => [])
  const invites = useState<TeamInvite[]>('store-team-invites', () => [])
  const loaded = useState('store-team-loaded', () => false)

  async function load() {
    const id = await storeUuid()
    if (!id) return
    const [{ data: team }, { data: waiting }] = await Promise.all([
      supabase.rpc('store_team', { target: id }),
      supabase.from('store_invites').select('id, email, role, created_at').eq('store_id', id).order('created_at', { ascending: false }),
    ])
    members.value = (team ?? []).map(m => ({ userId: m.user_id, name: m.name, email: m.email, role: m.role, joinedAt: m.joined_at }))
    invites.value = (waiting ?? []).map(i => ({ id: i.id, email: i.email, role: i.role, createdAt: i.created_at }))
    loaded.value = true
  }

  async function invite(email: string, role: StoreRole): Promise<string | null> {
    const id = await storeUuid()
    if (!id) return 'Your store isn\'t loaded. Refresh the page and try again.'
    const { data: made, error } = await supabase.from('store_invites').insert({ store_id: id, email, role }).select('id').single()
    if (error) {
      if (error.message.includes('already on the team')) return 'That person is already on your team.'
      if (error.code === '23505') return 'You\'ve already invited that email.'
      if (error.message.includes('20 invitations')) return 'You have 20 invitations waiting. Withdraw some first.'
      return 'The invitation didn\'t save. Check the email and try again.'
    }
    await load()
    // Email them a link (to sign up, or sign in if they have an account); the invitation waits in their account either way
    const mail = await $fetch<{ sent: boolean }>('/api/invites/email', { method: 'POST', body: { kind: 'store', id: made.id } }).catch(() => ({ sent: false }))
    useNotify().teamUpdated('Invitation sent', mail.sent
      ? `We emailed ${email} a link. It also waits in their account when they sign in or sign up with that email.`
      : `${email} sees it in their account when they sign in or sign up with that email.`)
    return null
  }

  async function withdraw(invite: TeamInvite) {
    const { error } = await supabase.from('store_invites').delete().eq('id', invite.id)
    if (error) return void useNotify().failed('That didn\'t work. Try again.')
    invites.value = invites.value.filter(i => i.id !== invite.id)
    useNotify().teamUpdated('Invitation withdrawn', `${invite.email} can no longer join with it.`)
  }

  async function changeRole(member: TeamMember, role: StoreRole) {
    const storeId = await storeUuid()
    const { data, error } = await supabase.from('store_members').update({ role }).eq('store_id', storeId!).eq('user_id', member.userId).select('role')
    if (error || !data?.length) return void useNotify().failed(error?.message.includes('at least one owner') ? 'Your store needs at least one owner. Make someone else an owner first.' : 'That didn\'t save. Try again.')
    await load()
    if (member.userId === user.value?.id) await reloadSession()
    const who = member.userId === user.value?.id ? 'You are' : `${member.name || 'This person'} is`
    useNotify().teamUpdated('Role changed', `${who} now ${storeRoles[role].label.toLowerCase()}.`)
  }

  // Removing someone else, or leaving yourself
  async function remove(member: TeamMember) {
    const storeId = await storeUuid()
    const { data, error } = await supabase.from('store_members').delete().eq('store_id', storeId!).eq('user_id', member.userId).select('user_id')
    if (error || !data?.length) return void useNotify().failed(error?.message.includes('at least one owner') ? 'Your store needs at least one owner. Make someone else an owner first.' : 'That didn\'t work. Try again.')
    if (member.userId === user.value?.id) return void (await reloadSession())
    members.value = members.value.filter(m => m.userId !== member.userId)
    useNotify().teamUpdated('Removed from the team', `${member.name || 'This person'} can no longer open your store dashboard.`)
  }

  return { members, invites, loaded, load, invite, withdraw, changeRole, remove }
}
