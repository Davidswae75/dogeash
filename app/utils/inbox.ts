import type { Component } from 'vue'
import { BadgeCheck, CalendarDays, MessageSquare, Star, Wallet } from '@lucide/vue'
import type { ConversationSummary } from '~/composables/useConversations'
import type { Visit } from '~/composables/useVisits'
import type { StorePermission } from './storeRoles'

// The store inbox: buyer messages and visit requests now (Supabase: conversations, visits); payments,
// reviews and Dogeash updates join as those arrive. Every message lives in the database; email,
// SMS or WhatsApp will only tell the other person there's something new, with a link back.

export type InboxKind = 'message' | 'booking' | 'payment' | 'review' | 'update'

export interface InboxItem {
  id: string
  kind: InboxKind
  from: string
  subject: string
  preview: string
  /** ISO time, for sorting and "5 min" labels */
  at: string
  unread: boolean
  status: 'open' | 'replied' | 'done'
  dogFileNo?: string
  conversation?: ConversationSummary
  visit?: Visit
}

export const inboxKinds: Record<InboxKind, { label: string, plural: string, icon: Component, tile: string, permission: StorePermission }> = {
  message: { label: 'Message', plural: 'Messages', icon: MessageSquare, tile: 'bg-marigold text-on-marigold', permission: 'enquiries' },
  booking: { label: 'Visit', plural: 'Visits', icon: CalendarDays, tile: 'bg-night text-marigold', permission: 'bookings' },
  payment: { label: 'Payment', plural: 'Payments', icon: Wallet, tile: 'bg-marigold-soft text-marigold-ink', permission: 'payouts' },
  review: { label: 'Review', plural: 'Reviews', icon: Star, tile: 'bg-surface-sunk text-ink ring-1 ring-line', permission: 'profile' },
  update: { label: 'Dogeash', plural: 'Updates', icon: BadgeCheck, tile: 'bg-ash-soft text-ink', permission: 'dogs' },
}

export const quickReplies = [
  'Yes, still available.',
  'You\'re welcome to visit. Which day suits you?',
  'I\'ll check with our trainer and get back to you today.',
]
