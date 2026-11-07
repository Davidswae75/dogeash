import type { Account } from '~/utils/account'
import type { CareType } from '~/utils/care'
import type { StoreRow } from '~/utils/stores'
import type { StorePermission } from '~/utils/storeRoles'
import { computed } from 'vue'
import { navigateTo, useRuntimeConfig, useState } from '#imports' // nuxt
import { useSupabaseClient, useSupabaseUser } from '#imports' // @nuxtjs/supabase
import { mergeGuestLists } from './useAccountList'
import { useLoader } from './useLoader'
import { useNotify } from './useNotify'
import { accountRef, firstNameOf, initialsOf } from '~/utils/account'
import { roleCan } from '~/utils/storeRoles'
import { storeColumns, toStore } from '~/utils/stores'

// Who is signed in: the Supabase user, their profile, and the stores they work at.
// plugins/account.ts loads it (on the server too, so the header is right on first paint);
// sign-in, sign-up and sign-out call load() and signOut() here. Pages read the result.
export function useSession() {
  const user = useState<Account | null>('session-account', () => null)

  const signedIn = computed(() => !!user.value)
  const firstName = computed(() => (user.value ? firstNameOf(user.value.name) : ''))
  const initials = computed(() => (user.value ? initialsOf(user.value.name || user.value.email) : ''))

  // Stores this person works at, with the store itself; empty for buyers only
  const memberships = computed(() => user.value?.stores ?? [])
  const hasStore = computed(() => memberships.value.length > 0)
  const memberOf = (storeId: string) => memberships.value.find(m => m.storeId === storeId)
  // Care listings they manage (empty for almost everyone)
  const providers = computed(() => user.value?.providers ?? [])
  const can = (storeId: string, permission: StorePermission) => {
    const m = memberOf(storeId)
    return !!m && roleCan(m.role, permission)
  }

  // Read the signed-in person's profile and store memberships. Pass the user straight after
  // signing in, before the auth state has caught up. Returns the account, or null if signed out.
  async function load(authUser?: { id: string, email?: string } | null) {
    const claims = useSupabaseUser().value
    const id = authUser?.id ?? claims?.sub
    if (!id) return (user.value = null)
    const supabase = useSupabaseClient()
    const storageUrl = useRuntimeConfig().public.supabase.url as string

    const [{ data: profile }, { data: members }, { data: providerRows }] = await Promise.all([
      supabase.from('profiles').select('full_name, phone, city, created_at, property, has_children, has_other_pets, experience, notify_email, notify_sms, notify_whatsapp').eq('id', id).maybeSingle(),
      supabase.from('store_members').select(`role, stores (${storeColumns})`).eq('user_id', id),
      supabase.from('care_provider_members').select('care_providers (id, public_id, name, slug, type)').eq('user_id', id),
    ])
    const name = profile?.full_name ?? ''
    user.value = {
      id,
      ref: accountRef(id),
      name,
      email: authUser?.email ?? (claims?.email as string | undefined) ?? '',
      phone: profile?.phone ?? '',
      city: profile?.city ?? '',
      memberSince: profile?.created_at ? String(new Date(profile.created_at).getFullYear()) : '',
      home: profile?.property && profile.experience
        ? { property: profile.property, city: profile.city ?? '', children: !!profile.has_children, otherPets: !!profile.has_other_pets, experience: profile.experience }
        : null,
      notify: { email: profile?.notify_email ?? true, sms: profile?.notify_sms ?? false, whatsapp: profile?.notify_whatsapp ?? false },
      stores: (members ?? [])
        .filter(m => m.stores)
        .map((m) => {
          const store = toStore(m.stores as unknown as StoreRow, name, storageUrl)
          return { storeId: store.id, role: m.role, store }
        }),
      providers: (providerRows ?? [])
        .map(r => r.care_providers as unknown as { id: string, public_id: string, name: string, slug: string, type: CareType } | null)
        .filter(p => !!p)
        .map(p => ({ id: p!.public_id, uuid: p!.id, name: p!.name, slug: p!.slug, type: p!.type })),
    }
    return user.value
  }

  // Lists still kept in this browser (recently viewed, gear cart) join the account.
  // The shortlist moves to Supabase separately (useSavedDogs().adoptGuest()).
  const mergeGuest = () => { if (user.value && import.meta.client) mergeGuestLists(user.value.id) }

  // Saved dogs stay with the account; this browser goes back to the guest's (empty) lists.
  // The admin console passes its own line; staff access is forgotten either way, so the next sign-in starts fresh.
  async function signOut(text = 'Your saved dogs stay safe in your account.') {
    const notify = useNotify()
    await useLoader().run('Signing you out…', async () => {
      await useSupabaseClient().auth.signOut()
      user.value = null
      useState('saved-dogs').value = null
      useState('staff-role').value = null
      useState('staff-loaded').value = false
      useState('owned-dogs').value = []
      useState('owned-dogs-loaded').value = false
      await navigateTo('/')
    }, text)
    notify.signedOut()
  }

  return { user, signedIn, firstName, initials, memberships, hasStore, memberOf, can, providers, load, mergeGuest, signOut }
}
