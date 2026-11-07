import { useState, useSupabaseClient } from '#imports'
import type { CareProvider, CareRow } from '~/utils/care'
import { careColumns, listedProviders, toCareProvider } from '~/utils/care'

// Admin › Care directory: every provider (read straight from care_providers, which is public), and adding,
// editing and removing them (admin_save_provider(), admin_delete_provider()). The site's directory updates too.
// Also who manages each listing, and inviting someone to (admin_provider_managers(), admin_invite_provider()).
export type ProviderDraft = Omit<CareProvider, 'id' | 'rating' | 'reviews'> & { id?: string }

export function useAdminCare() {
  const supabase = useSupabaseClient()
  const providers = useState<CareProvider[]>('admin-care', () => [])
  const managers = useState<{ members: { provider: string, name: string, email: string }[], invites: { id: string, provider: string, email: string, createdAt: string }[] }>('admin-care-managers', () => ({ members: [], invites: [] }))

  async function load() {
    const { data } = await supabase.from('care_providers').select(careColumns).order('public_id')
    providers.value = ((data ?? []) as unknown as CareRow[]).map(toCareProvider)
    listedProviders.value = [...providers.value].sort((a, b) => b.rating - a.rating)
    const { data: m } = await supabase.rpc('admin_provider_managers')
    if (m) managers.value = m as unknown as typeof managers.value
  }

  // Who manages a listing, and who's been invited to
  const managedBy = (id: string) => ({
    members: managers.value.members.filter(m => m.provider === id),
    invites: managers.value.invites.filter(i => i.provider === id),
  })

  async function invite(p: CareProvider, email: string): Promise<string | null> {
    const { error } = await supabase.rpc('admin_invite_provider', { provider: p.id, invite_email: email })
    if (error) return error.message.includes('look right') ? 'That email doesn\'t look right.' : error.message.includes('already manages') ? 'That person already manages this listing.' : 'That didn\'t work. Try again.'
    await load()
    return null
  }

  async function save(p: ProviderDraft): Promise<string | null> {
    const { error } = await supabase.rpc('admin_save_provider', { p: p as never })
    if (error) return error.message.includes('name') ? 'Give the provider a name.' : error.code === '23505' ? 'A provider with that name already exists.' : 'That didn\'t save. Check the details and try again.'
    await load()
    return null
  }

  async function remove(p: CareProvider): Promise<string | null> {
    const { error } = await supabase.rpc('admin_delete_provider', { target: p.id })
    if (error) return 'That didn\'t work. Try again.'
    await load()
    return null
  }

  return { providers, managers, managedBy, load, save, remove, invite }
}
