import type { Component } from 'vue'
import { BellRing, CalendarCheck, Dog as DogIcon, Heart, House, LayoutGrid, MessageSquare, Package, Settings, ShieldCheck, Star } from '@lucide/vue'
import type { Dog } from './dogs'
import type { PropertyType } from './protection'
import type { StoreMembership } from './storeRoles'

// The signed-in buyer, until accounts are connected: one sample account, what the header shows
// them (the account menu and notifications) and what their Home is built from.

export interface Account {
  id: string
  name: string
  email: string
  city: string
  memberSince: string
  /** Stores this person works at, and their role in each */
  stores?: StoreMembership[]
}

export const sampleAccount: Account = {
  id: 'BYR-0417',
  name: 'Adaeze Okafor',
  email: 'adaeze@example.com',
  city: 'Abuja',
  memberSince: '2026',
  // Manages K9 Guardian Kennels (owned by Col. Ibrahim Danjuma), and buys on Dogeash too
  stores: [{ storeId: 'STR-001', role: 'manager' }],
}

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
      { label: 'Shortlist', to: '/shortlist', icon: Heart, inMenu: true },
      { label: 'Visits and bookings', to: '/account/bookings', icon: CalendarCheck, soon: true, inMenu: true },
      { label: 'Reservations', to: '/account/reservations', icon: ShieldCheck, soon: true },
      { label: 'Messages', to: '/account/messages', icon: MessageSquare, soon: true, inMenu: true },
      { label: 'Saved searches', to: '/account/alerts', icon: BellRing, soon: true },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Home profile', to: '/account/profile', icon: House, soon: true },
      { label: 'Reviews', to: '/account/reviews', icon: Star, soon: true },
      { label: 'Gear orders', to: '/account/orders', icon: Package, soon: true },
      { label: 'Settings', to: '/account/settings', icon: Settings, soon: true, inMenu: true },
    ],
  },
]

// What each unbuilt section will hold, shown on its "Coming next" page
export const accountSections: Record<string, { title: string, text: string, plan: string[] }> = {
  bookings: { title: 'Visits and bookings', text: 'Kennel visits and care appointments in one place.', plan: ['Confirm, move or cancel a visit', 'Directions and what to bring', 'Booking history for each dog'] },
  reservations: { title: 'Reservations', text: 'The dog you\'ve put a deposit on, from reservation to handover.', plan: ['Deposit held in escrow, with a countdown', 'Handover checklist and date', 'What happens if the visit doesn\'t work out'] },
  messages: { title: 'Messages', text: 'Conversations with stores and care providers.', plan: ['Ask a store about a dog', 'Replies by email, SMS or WhatsApp', 'Every message tied to the dog it\'s about'] },
  alerts: { title: 'Saved searches', text: 'Searches we watch for you.', plan: ['Save any search on Find a guard dog', 'Get told when a matching dog is listed', 'Pause or delete alerts'] },
  profile: { title: 'Home profile', text: 'What you\'re protecting, so we can match dogs to it.', plan: ['Property type and city', 'Children, staff and other pets', 'Your experience with guard dogs'] },
  reviews: { title: 'Reviews', text: 'Review the stores and providers you\'ve used.', plan: ['Rate a store after handover', 'Rate vets and trainers after a booking', 'Edit or remove your reviews'] },
  orders: { title: 'Gear orders', text: 'Harnesses, kennels and other gear you\'ve ordered.', plan: ['Track deliveries', 'Reorder food and supplies', 'Returns and receipts'] },
  settings: { title: 'Settings', text: 'Your account and how we reach you.', plan: ['Sign-in and one-time code security', 'Notifications by email, SMS and WhatsApp', 'Payment methods for deposits and bookings'] },
}

// Before a store takes a deposit, the buyer completes these
export const reserveChecklist = [
  { label: 'Phone number confirmed', done: true },
  { label: 'Email confirmed', done: true },
  { label: 'Home profile filled in', done: true },
  { label: 'ID check', done: false, text: 'Stores ask for this before taking a deposit. Coming soon.' },
]

// Sample notifications for the header bell
export type NotificationKind = 'reserved' | 'price' | 'visit' | 'listing'

export interface AccountNotification {
  id: string
  kind: NotificationKind
  title: string
  text: string
  at: string
  to: string
  unread: boolean
}

export const sampleNotifications: AccountNotification[] = [
  { id: 'n1', kind: 'visit', title: 'Kennel visit confirmed', text: 'K9 Guardian Kennels, Sat 10:30. Bring ID for the gate.', at: '12 min', to: '/shortlist', unread: true },
  { id: 'n2', kind: 'reserved', title: 'Flash was reserved', text: 'Another buyer put down a deposit. Flash stays on your shortlist.', at: '2 h', to: '/shortlist', unread: true },
  { id: 'n3', kind: 'price', title: 'Price drop on Sarge', text: 'Now ₦2.4m, down from ₦2.6m.', at: 'Yesterday', to: '/dogs/kd-2026-014', unread: false },
  { id: 'n4', kind: 'listing', title: 'New Level 4 dog in Abuja', text: 'Onyx, a Giant Schnauzer, matches your saved search.', at: '2 days', to: '/dogs?level=4&city=Abuja', unread: false },
]

// What the buyer told us about their home; used to match dogs (Phase 5a: editable in the account)
export interface BuyerProfile { property: PropertyType, city: string, children: boolean, experience: string }

export const sampleBuyerProfile: BuyerProfile = { property: 'compound', city: 'Abuja', children: true, experience: 'First guard dog' }

// Visits and care appointments
export interface Booking {
  id: string
  kind: string
  with: string
  to: string
  day: string
  time: string
  where: string
  detail: string
  status: 'confirmed' | 'requested'
}

export const sampleBookings: Booking[] = [
  { id: 'BK-2201', kind: 'Kennel visit', with: 'K9 Guardian Kennels', to: '/stores/k9-guardian-kennels', day: 'Sat 1 Nov', time: '10:30', where: 'Kuje, Abuja', detail: 'Meet Rambo and Sarge, with the handler', status: 'confirmed' },
  { id: 'BK-2214', kind: 'Vet check', with: 'Kuje Veterinary Clinic', to: '/stores/k9-guardian-kennels', day: 'Tue 4 Nov', time: '14:00', where: 'At the kennel', detail: 'Pre-purchase health check on your chosen dog', status: 'requested' },
]

// Earlier prices, to show drops on shortlisted dogs
export const samplePriceDrops: Record<string, number> = {
  'KD-2026-014': 2_600_000,
  'KD-2026-046': 2_200_000,
}

// A search the buyer saved; new matching listings show on Home and in the bell
export interface SavedSearch { label: string, to: string, matches: (dog: Dog) => boolean }

export const sampleSavedSearch: SavedSearch = {
  label: 'Level 4 · Abuja',
  to: '/dogs?level=4&city=Abuja',
  matches: dog => dog.level === 4 && dog.city === 'Abuja',
}

// A shortlisted dog that changed since it was saved: reserved by someone else, or cheaper
export type ShortlistChange =
  | { dog: Dog, kind: 'reserved' }
  | { dog: Dog, kind: 'price', was: number }

export function shortlistChanges(dogs: Dog[]): ShortlistChange[] {
  return dogs.flatMap((dog): ShortlistChange[] => {
    if (dog.status === 'reserved') return [{ dog, kind: 'reserved' }]
    const was = samplePriceDrops[dog.fileNo]
    return was && was > dog.priceNaira ? [{ dog, kind: 'price', was }] : []
  })
}
