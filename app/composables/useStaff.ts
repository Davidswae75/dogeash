import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import type { Database } from '~/types/database.types'
import { useSession } from './useSession'

// Dogeash staff (Supabase: staff, added only in the SQL editor) and the one-time code they need.
// Every staff power in the database also checks that the session passed a code from an authenticator
// app (aal2), so the admin dashboard asks for one before anything else. Errors come back as messages.
export type StaffRole = Database['public']['Enums']['staff_role']

export function useStaff() {
  const supabase = useSupabaseClient()
  const { user } = useSession()
  const role = useState<StaffRole | null>('staff-role', () => null)
  const loaded = useState('staff-loaded', () => false)

  async function load() {
    if (!user.value) {
      role.value = null
    }
    else {
      const { data } = await supabase.from('staff').select('role').eq('user_id', user.value.id).maybeSingle()
      role.value = data?.role ?? null
    }
    loaded.value = true
  }

  // Has this session passed a one-time code?
  async function hasCode() {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    return data?.currentLevel === 'aal2'
  }

  // The authenticator app already set up, if any
  async function factor() {
    const { data } = await supabase.auth.mfa.listFactors()
    return data?.totp[0] ?? null
  }

  // Start setting up an authenticator app: a QR code to scan and the key to type if scanning fails.
  // Half-finished set-ups from before are cleared first.
  async function enroll(): Promise<{ id: string, qr: string, secret: string } | { error: string }> {
    const { data: list } = await supabase.auth.mfa.listFactors()
    for (const f of list?.all ?? []) if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Dogeash admin ${new Date().toISOString().slice(0, 10)}` })
    if (error || !data) return { error: 'The authenticator set-up didn\'t start. Try again.' }
    return { id: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
  }

  // Check a 6-digit code from the app; on success the session is upgraded (aal2)
  async function verify(factorId: string, code: string): Promise<string | null> {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    if (!error) return null
    return error.message.toLowerCase().includes('invalid') ? 'That code didn\'t match. Check the app and try the newest code.' : 'That didn\'t work. Try again.'
  }

  return { role, loaded, isAdmin: computed(() => role.value === 'admin'), load, hasCode, factor, enroll, verify }
}
