import type { Component } from 'vue'
import { BellRing, CalendarCheck, Dog as DogIcon, Heart, House, LayoutGrid, MessageSquare, Package, Settings, ShieldCheck, Star } from '@lucide/vue'
import type { Dog } from './dogs'
import type { PropertyType } from './protection'
import type { Store } from './stores'
import type { StoreMembership } from './storeRoles'

// The signed-in person (loaded from Supabase by plugins/account.ts), what the header shows them
// (the account menu and notifications) and, for now, the sample data their Home is built from.

export interface Account {
  /** Supabase auth user id */
  id: string
  /** Short reference to show people, e.g. BYR-3F9A2C */
  ref: string
  name: string
  email: string
  phone: string
  city: string
  memberSince: string
  /** What they're protecting, for matching; null until they fill it in */
  home: BuyerProfile | null
  notify: { email: boolean, sms: boolean, whatsapp: boolean }
  /** Stores this person works at, their role in each, and the store itself */
  stores: (StoreMembership & { store: Store })[]
}

export const accountRef = (id: string) => `BYR-${id.replaceAll('-', '').slice(0, 6).toUpperCase()}`

export const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] ?? ''
export const initialsOf = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')

// The account area's navigation: the sidebar (or tabs on phones) and, where `inMenu`, the header's avatar menu.
// `soon` sections show a "Coming next" page until they're built (PLAN.md Phase 5a).
export interface AccountNavItem { label: string, to: string, icon: Component, soon?: boolean, inMenu?: boolean }

export const accountNav: { group: string, items: AccountNavItem[] }[] = [
  {
    group: 'My Dogeash',
    items: [
      { label: 'Overview', to: '/account', icon: LayoutGrid, inMenu: true },
      { label: 'My dogs', to: '/account/dogs', icon: DogIcon, inMenu: true },
      { label: 'Shortlist', to: '/account/shortlist', icon: Heart, inMenu: true },
      { label: 'Visits and bookings', to: '/account/bookings', icon: CalendarCheck, inMenu: true },
      { label: 'Reservations', to: '/account/reservations', icon: ShieldCheck, soon: true },
      { label: 'Messages', to: '/account/messages', icon: MessageSquare, inMenu: true },
      { label: 'Saved searches', to: '/account/alerts', icon: BellRing },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Home profile', to: '/account/profile', icon: House },
      { label: 'Reviews', to: '/account/reviews', icon: Star },
      { label: 'Gear orders', to: '/account/orders', icon: Package, soon: true },
      { label: 'Settings', to: '/account/settings', icon: Settings, inMenu: true },
    ],
  },
]

// What each unbuilt section will hold, shown on its "Coming next" page
export const accountSections: Record<string, { title: string, text: string, plan: string[] }> = {
  reservations: { title: 'Reservations', text: 'The dog you\'ve put a deposit on, from reservation to handover.', plan: ['Deposit held in escrow, with a countdown', 'Handover checklist and date', 'What happens if the visit doesn\'t work out'] },
  orders: { title: 'Gear orders', text: 'Harnesses, kennels and other gear you\'ve ordered.', plan: ['Track deliveries', 'Reorder food and supplies', 'Returns and receipts'] },
}

// Before a store takes a deposit, the buyer completes these (worked out from the account and their visits).
// Anything not done links to where to do it.
export interface ReadinessItem { label: string, done: boolean, text?: string, to?: string }
export function reserveChecklist(account: Pick<Account, 'phone' | 'home'> | null, visitedAStore: boolean): ReadinessItem[] {
  return [
    { label: 'Email confirmed', done: !!account },
    { label: 'Phone number added', done: !!account?.phone, text: 'Stores use it to confirm visits.', to: '/account/settings' },
    { label: 'Home profile filled in', done: !!account?.home, text: 'So stores can suggest dogs that suit your home.', to: '/account/profile' },
    { label: 'Met the dogs at a kennel', done: visitedAStore, text: 'Book a visit from your shortlist.', to: '/account/shortlist' },
    { label: 'ID check', done: false, text: 'Stores ask for this before taking a deposit. Coming soon.' },
  ]
}

// What the buyer told us about their home; dogs are matched against it (Home profile page)
export type HandlerExperience = 'first-time' | 'some' | 'experienced' | 'professional'
export interface BuyerProfile { property: PropertyType, city: string, children: boolean, otherPets: boolean, experience: HandlerExperience }

export const experienceOptions: { value: HandlerExperience, label: string, hint: string }[] = [
  { value: 'first-time', label: 'First guard dog', hint: 'Stores will suggest dogs that forgive mistakes, and handover training matters most.' },
  { value: 'some', label: 'Had dogs before', hint: 'Family or guard dogs in the past, but not trained protection work.' },
  { value: 'experienced', label: 'Experienced', hint: 'You\'ve handled a trained guard dog and kept up its training.' },
  { value: 'professional', label: 'Professional handler', hint: 'Security, police or military dog work, or a trained handler on staff.' },
]

// A shortlisted dog that changed since it was saved: reserved by someone else, or cheaper
export type ShortlistChange =
  | { dog: Dog, kind: 'reserved' }
  | { dog: Dog, kind: 'price', was: number }

export function shortlistChanges(dogs: Dog[], savedPrices: Record<string, number>): ShortlistChange[] {
  return dogs.flatMap((dog): ShortlistChange[] => {
    if (dog.status === 'reserved') return [{ dog, kind: 'reserved' }]
    const was = savedPrices[dog.fileNo]
    return was && was > dog.priceNaira ? [{ dog, kind: 'price', was }] : []
  })
}
