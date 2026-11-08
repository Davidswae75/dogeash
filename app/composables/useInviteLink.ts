import { LayoutDashboard, ListChecks, Stethoscope, Store, UserRound, Users } from '@lucide/vue'
import type { Component } from 'vue'
import { computed } from 'vue'
import { useAsyncData, useRoute, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { AuthLinkCard } from '~/components/auth/AuthLinkCards.vue'
import type { AuthPanelMeta } from '~/types/page-meta'
import type { CareType } from '~/utils/care'
import type { StoreRole } from '~/utils/storeRoles'
import { careTypes } from '~/utils/care'
import { storeRoles } from '~/utils/storeRoles'
import { useSession } from './useSession'

// An invitation link (?invite=<id>&kind=provider|store, from the invitation email) on sign-up and sign-in:
// what the person is accepting, the words and panel for the page, and accepting it once they're signed in.
// Read on the server with the page (invite_preview()), so the page arrives already tailored.
export interface InvitePreview {
  kind: 'provider' | 'store'
  email: string
  name: string
  city: string
  type?: CareType
  role?: StoreRole
  invitedBy?: string
}

// The side panel for an invitation link, by kind. The auth layout uses it straight from the address, so the
// first paint already shows it (the page reads the invitation itself a moment later).
export const invitePanels: Record<'provider' | 'store', AuthPanelMeta> = {
  provider: { variant: 'night', title: 'Your practice,', outline: 'booked.', text: 'Dog owners find and book vets, trainers and groomers on Dogeash, and keep each visit on their dog\'s record.' },
  store: { variant: 'night', title: 'Your kennel\'s', outline: 'team.', text: 'Everyone who runs the kennel, in one dashboard: dogs, messages, kennel visits and the store profile.' },
}

export interface InviteCopy {
  heading: { title: string, outline: string, text: string }
  card: { icon: Component, label: string, text: string }
  panel: AuthPanelMeta
  submitLabel: string
  welcome: string
  nextSteps: AuthLinkCard[]
  to: string
}

export async function useInviteLink() {
  const route = useRoute()
  const supabase = useSupabaseClient()
  const session = useSession()
  const id = typeof route.query.invite === 'string' ? route.query.invite : ''
  const kind = route.query.kind === 'store' ? 'store' : 'provider'

  const { data: preview } = await useAsyncData(`invite-${kind}-${id}`, async () => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const { data } = await supabase.rpc('invite_preview', { kind, invite: id })
    return (data as unknown as InvitePreview | null) ?? null
  })

  const copy = computed<InviteCopy | null>(() => {
    const p = preview.value
    if (!p) return null
    if (p.kind === 'provider') {
      const type = p.type ? careTypes[p.type].label : 'Care provider'
      return {
        heading: { title: 'You\'re invited to manage', outline: p.name, text: 'Create your account and you\'ll go straight to your provider dashboard.' },
        card: { icon: Stethoscope, label: `Care provider · ${type}, ${p.city}`, text: `Dogeash invited you to manage ${p.name}: answer bookings, keep the listing up to date, and add visits to dogs' records when owners allow it.` },
        panel: invitePanels.provider,
        submitLabel: `Create account and manage ${p.name}`,
        welcome: `You now manage ${p.name}. Your bookings and listing are in your provider dashboard.`,
        nextSteps: [
          { to: '/provider', title: 'Open your dashboard', text: 'Booking requests to answer, and appointments coming up.', icon: LayoutDashboard },
          { to: '/provider/listing', title: 'Check your listing', text: 'Your days and times, prices, areas and what buyers read about you.', icon: ListChecks },
          { to: '/account', title: 'Your account', text: 'Your details, and settings for notifications.', icon: UserRound },
        ],
        to: '/provider',
      }
    }
    const role = storeRoles[p.role ?? 'handler']
    return {
      heading: { title: 'Join', outline: p.name, text: `${p.invitedBy ?? 'The owner'} invited you as ${role.label.toLowerCase()}. Create your account and you'll go straight to the store dashboard.` },
      card: { icon: Users, label: `Store team · ${role.label}`, text: `${p.name}, ${p.city}. As ${role.label.toLowerCase()} you'll work on: ${role.hint.toLowerCase()}.` },
      panel: invitePanels.store,
      submitLabel: `Create account and join ${p.name}`,
      welcome: `You're on ${p.name}'s team as ${role.label.toLowerCase()}.`,
      nextSteps: [
        { to: '/dashboard', title: `Open ${p.name}'s dashboard`, text: 'Dogs, messages and kennel visits.', icon: LayoutDashboard },
        { to: '/dashboard/team', title: 'Meet the team', text: 'Who else runs the store, and their roles.', icon: Users },
        { to: '/account', title: 'Your account', text: 'Your details, and settings for notifications.', icon: Store },
      ],
      to: '/dashboard',
    }
  })

  // Once signed in with the invited email: accept it and refresh what the account can open.
  // Returns an error for the person, or null when it worked.
  async function accept(): Promise<string | null> {
    if (!preview.value) return null
    const { error } = kind === 'provider'
      ? await supabase.rpc('accept_provider_invite', { target: id })
      : await supabase.rpc('accept_store_invite', { target: id })
    await session.load()
    if (error) return `The invitation couldn't be accepted: it may have been withdrawn, or it's for ${preview.value.email} and you used a different email. You can still accept it from your account.`
    return null
  }

  // The same page without the invitation (for "Not you?")
  const query = id ? { invite: id, kind } : {}

  return { preview, copy, accept, query }
}
