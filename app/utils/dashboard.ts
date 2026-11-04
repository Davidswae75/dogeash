// Store dashboard: navigation and example figures until accounts and the API exist.
// The signed-in store is K9 Guardian Kennels for now. Each item names the permission it needs
// (see storeRoles.ts); people only see what their role allows.
import type { Visit } from '~/composables/useVisits'
import type { StoreDog } from './dogs'
import type { InboxItem } from './inbox'
import type { StorePermission } from './storeRoles'
import type { Store } from './stores'
import { shortTime, visitDay } from './time'

export const dashboardNav: { group: string, items: { to: string, label: string, icon: string, badge?: number, permission?: StorePermission }[] }[] = [
  {
    group: 'Manage',
    items: [
      { to: '/dashboard', label: 'Overview', icon: 'LayoutDashboard' },
      { to: '/dashboard/dogs', label: 'Dogs', icon: 'Dog', permission: 'dogs' },
      { to: '/dashboard/inbox', label: 'Inbox', icon: 'MessageSquare', permission: 'enquiries' },
      { to: '/dashboard/bookings', label: 'Bookings', icon: 'CalendarDays', permission: 'bookings' },
      { to: '/dashboard/reviews', label: 'Reviews', icon: 'Star', permission: 'enquiries' },
      { to: '/dashboard/care', label: 'Care team', icon: 'Stethoscope', permission: 'care' },
    ],
  },
  {
    group: 'Store',
    items: [
      { to: '/dashboard/profile', label: 'Store profile', icon: 'Store', permission: 'profile' },
      { to: '/dashboard/payouts', label: 'Payouts', icon: 'Wallet', permission: 'payouts' },
      { to: '/dashboard/team', label: 'Team', icon: 'Users', permission: 'team' },
      { to: '/dashboard/settings', label: 'Settings', icon: 'Settings', permission: 'settings' },
    ],
  },
]

// What each section will hold, shown until it is built
export const dashboardSections: Record<string, { title: string, text: string, plan: string[] }> = {
  payouts: { title: 'Payouts', text: 'Deposits, sales and money paid to your bank.', plan: ['Bank account for payouts', 'Escrow deposits and releases', 'Statements and platform fees'] },
}

// Example figures for the design
export const dashboardStats = [
  { label: 'Store views', value: '1,284', change: '+12%', up: true, trend: [38, 42, 40, 51, 47, 58, 64] },
  { label: 'New enquiries', value: '18', change: '+5', up: true, trend: [2, 3, 1, 4, 2, 3, 3] },
  { label: 'Kennel visits booked', value: '5', change: '+2', up: true, trend: [0, 1, 1, 0, 1, 1, 1] },
  { label: 'Dogs for sale', value: '4', change: '1 reserved', up: false, trend: [5, 5, 5, 4, 4, 4, 4] },
]

// What needs doing, most urgent first, from the store's inbox, visits and dogs.
// Each item names the permission needed to act on it; the panel shows only what this person's role allows.
export interface AttentionItem { icon: 'MessageSquare' | 'CalendarDays' | 'FilePen', title: string, text: string, action: string, to: string, tone: 'marigold' | 'night' | 'ash', when: string, permission: StorePermission }

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function attentionItems(unread: InboxItem[], waiting: Visit[], drafts: StoreDog[]): AttentionItem[] {
  const items: AttentionItem[] = []
  const oldest = unread.at(-1)
  if (oldest) {
    items.push({ icon: 'MessageSquare', title: `${count(unread.length, 'message', 'messages')} waiting for a reply`, text: `Oldest from ${oldest.from} about ${oldest.subject}`, action: 'Reply', to: `/dashboard/inbox?id=${oldest.id}`, tone: 'marigold', when: shortTime(oldest.at), permission: 'enquiries' })
  }
  const soonest = waiting[0]
  if (soonest) {
    items.push({ icon: 'CalendarDays', title: `${count(waiting.length, 'visit request', 'visit requests')} to answer`, text: `Soonest: ${soonest.buyerName}, ${visitDay(soonest.day).label} at ${soonest.slot}`, action: 'Answer', to: '/dashboard/bookings', tone: 'night', when: visitDay(soonest.day).label, permission: 'bookings' })
  }
  if (drafts.length) {
    items.push({ icon: 'FilePen', title: `${count(drafts.length, 'draft', 'drafts')} not live yet`, text: `${drafts.slice(0, 3).map(d => d.name).join(', ')}${drafts.length > 3 ? ' and more' : ''}. Buyers can't see drafts.`, action: 'Finish', to: '/dashboard/dogs', tone: 'ash', when: 'When ready', permission: 'dogs' })
  }
  return items
}

// Views and enquiries per dog, last 30 days
export const dashboardDogStats: Record<string, { views: number, enquiries: number }> = {
  'KD-2026-003': { views: 412, enquiries: 6 },
  'KD-2026-014': { views: 388, enquiries: 7 },
  'KD-2026-036': { views: 201, enquiries: 3 },
}

// What's filled in on the store profile, for the overview's Store health card
export const profileChecklist = (s: Store) => [
  { label: 'About and history', to: '/dashboard/profile', permission: 'profile' as const, done: s.about.length >= 40 && s.history.length > 0 },
  { label: 'Owner profile', to: '/dashboard/profile', permission: 'profile' as const, done: !!s.owner.name && !!s.owner.bio },
  { label: 'What you offer', to: '/dashboard/profile', permission: 'profile' as const, done: s.services.length > 0 },
  { label: 'Opening hours and delivery', to: '/dashboard/profile', permission: 'profile' as const, done: !!s.hours && !!s.deliveryAreas },
  { label: 'Banner and logo', to: '/dashboard/profile', permission: 'profile' as const, done: !!s.banner && !!s.logo },
  { label: 'Care team', to: '/dashboard/care', permission: 'care' as const, done: s.care.length > 0 },
]
