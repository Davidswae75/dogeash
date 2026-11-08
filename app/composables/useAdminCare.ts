import { useState, useSupabaseClient } from '#imports'
import type { CareProvider, CareRow } from '~/utils/care'
import { careColumns, listedProviders, toCareProvider } from '~/utils/care'
import { fetchError } from '~/utils/fetchError'

// Admin › Care directory: every provider, listed or hidden (staff read them all), and adding,
// editing and removing them (admin_save_provider(), admin_delete_provider()). The site's directory updates too.
// Also who manages each listing, and inviting someone to (admin_provider_managers(), admin_invite_provider()).
export type ProviderDraft = Omit<CareProvider, 'id' | 'rating' | 'reviews'> & { id?: string }
export interface InviteResult { email: string, invited: boolean, emailed: boolean, error?: string }

export function useAdminCare() {
  const supabase = useSupabaseClient()
  const providers = useState<CareProvider[]>('admin-care', () => [])
  const loaded = useState('admin-care-loaded', () => false)
  const managers = useState<{ members: { provider: string, name: string, email: string }[], invites: { id: string, provider: string, email: string, createdAt: string }[] }>('admin-care-managers', () => ({ members: [], invites: [] }))

  async function load() {
    const { data } = await supabase.from('care_providers').select(careColumns).order('public_id')
    providers.value = ((data ?? []) as unknown as CareRow[]).map(toCareProvider)
    listedProviders.value = providers.value.filter(p => p.listed !== false).sort((a, b) => b.rating - a.rating)
    loaded.value = true
    const { data: m } = await supabase.rpc('admin_provider_managers')
    if (m) managers.value = m as unknown as typeof managers.value
  }

  // Who manages a listing, and who's been invited to
  const managedBy = (id: string) => ({
    members: managers.value.members.filter(m => m.provider === id),
    invites: managers.value.invites.filter(i => i.provider === id),
  })

  // Invite people to manage a listing, and email each a link to sign up (or sign in) and accept.
  // Inviting the same email again sends a fresh email. One result per email, for the admin to read.
  async function inviteAll(providerId: string, emails: string[]): Promise<InviteResult[]> {
    const results: InviteResult[] = []
    for (const raw of emails) {
      const email = raw.trim().toLowerCase()
      const { error } = await supabase.rpc('admin_invite_provider', { provider: providerId, invite_email: email })
      if (error) {
        results.push({ email, invited: false, emailed: false, error: error.message.includes('look right') ? 'not a valid email' : error.message.includes('already manages') ? 'already manages it' : 'couldn\'t be invited' })
        continue
      }
      const { data: made } = await supabase.from('care_provider_invites').select('id, care_providers!inner (public_id)').eq('email', email).eq('care_providers.public_id', providerId).maybeSingle()
      const mail = made
        ? await $fetch<{ sent: boolean, error: string | null }>('/api/invites/email', { method: 'POST', body: { kind: 'provider', id: made.id } }).catch(e => ({ sent: false, error: fetchError(e) }))
        : { sent: false, error: 'invitation not found' }
      results.push({ email, invited: true, emailed: mail.sent, error: mail.sent ? undefined : (mail.error ?? undefined) })
    }
    await load()
    return results
  }

  // Add or edit a provider, then invite whoever was added to manage it. Returns an error, or the invitations' results.
  async function save(p: ProviderDraft, emails: string[] = []): Promise<{ error: string | null, invites: InviteResult[] }> {
    const { data: id, error } = await supabase.rpc('admin_save_provider', { p: p as never })
    if (error) return { error: error.message.includes('name') ? 'Give the provider a name.' : error.code === '23505' ? 'A provider with that name already exists.' : 'That didn\'t save. Check the details and try again.', invites: [] }
    const invites = emails.length ? await inviteAll(String(id), emails) : []
    if (!emails.length) await load()
    return { error: null, invites }
  }

  async function remove(p: CareProvider): Promise<string | null> {
    const { error } = await supabase.rpc('admin_delete_provider', { target: p.id })
    if (error) return 'That didn\'t work. Try again.'
    await load()
    return null
  }

  return { providers, loaded, managers, managedBy, load, save, remove, inviteAll }
}
