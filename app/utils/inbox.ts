import type { Component } from 'vue'
import { BadgeCheck, CalendarDays, MessageSquare, Star, Wallet } from '@lucide/vue'
import type { StorePermission } from './storeRoles'

// The store inbox: buyer messages, booking requests, payments, reviews and Dogeash updates in one list.
// Sample items until the API exists. When it does, every message lives in the database (the record
// the store sees); email, SMS or WhatsApp tell the other person there's something new, with a link back.

export type InboxKind = 'message' | 'booking' | 'payment' | 'review' | 'update'
export type InboxChannel = 'email' | 'sms' | 'whatsapp'

export interface InboxMessage { from: 'buyer' | 'store', name: string, text: string, at: string }
export interface InboxAction { label: string, done: string, to?: string, primary?: boolean }

export interface InboxItem {
  id: string
  kind: InboxKind
  from: string
  city?: string
  subject: string
  preview: string
  at: string
  unread: boolean
  status: 'open' | 'replied' | 'done'
  dogFileNo?: string
  /** How the buyer hears about replies, besides Dogeash itself */
  channels?: InboxChannel[]
  thread?: InboxMessage[]
  details?: { label: string, value: string }[]
  actions?: InboxAction[]
}

export const inboxKinds: Record<InboxKind, { label: string, plural: string, icon: Component, tile: string, permission: StorePermission }> = {
  message: { label: 'Message', plural: 'Messages', icon: MessageSquare, tile: 'bg-marigold text-on-marigold', permission: 'enquiries' },
  booking: { label: 'Booking', plural: 'Bookings', icon: CalendarDays, tile: 'bg-night text-marigold', permission: 'bookings' },
  payment: { label: 'Payment', plural: 'Payments', icon: Wallet, tile: 'bg-marigold-soft text-marigold-ink', permission: 'payouts' },
  review: { label: 'Review', plural: 'Reviews', icon: Star, tile: 'bg-surface-sunk text-ink ring-1 ring-line', permission: 'profile' },
  update: { label: 'Dogeash', plural: 'Updates', icon: BadgeCheck, tile: 'bg-ash-soft text-ink', permission: 'dogs' },
}

export const channelLabels: Record<InboxChannel, string> = { email: 'email', sms: 'SMS', whatsapp: 'WhatsApp' }

export const sampleInbox: InboxItem[] = [
  {
    id: 'msg-aisha-sarge',
    kind: 'message',
    from: 'Aisha B.',
    city: 'Maitama, Abuja',
    subject: 'Sarge',
    preview: 'Is he alright around a cat? We have one indoors.',
    at: '5 h',
    unread: true,
    status: 'open',
    dogFileNo: 'KD-2026-014',
    channels: ['email', 'sms'],
    thread: [
      { from: 'buyer', name: 'Aisha B.', text: 'Good morning. Is Sarge still available? We\'re in Maitama with two children (8 and 11).', at: 'Mon 09:12' },
      { from: 'store', name: 'K9 Guardian Kennels', text: 'Good morning Aisha. Yes, Sarge is available and very good with children. Would you like to visit this week?', at: 'Mon 10:40' },
      { from: 'buyer', name: 'Aisha B.', text: 'Is he alright around a cat? We have one indoors.', at: 'Today 07:55' },
    ],
  },
  {
    id: 'msg-tunde-mamba',
    kind: 'message',
    from: 'Tunde O.',
    city: 'Asokoro, Abuja',
    subject: 'Mamba',
    preview: 'Can I bring my driver and gateman to the visit on Tuesday?',
    at: '8 h',
    unread: true,
    status: 'open',
    dogFileNo: 'KD-2026-058',
    channels: ['whatsapp', 'email'],
    thread: [
      { from: 'buyer', name: 'Tunde O.', text: 'Can I bring my driver and gateman to the visit on Tuesday? They\'ll be the ones handling him day to day.', at: 'Today 05:10' },
    ],
  },
  {
    id: 'booking-folake',
    kind: 'booking',
    from: 'Folake A.',
    city: 'Maitama, Abuja',
    subject: 'Handover: Kaia',
    preview: 'Asks for Thursday 29 Oct at 14:00, at her gate',
    at: 'Yesterday',
    unread: true,
    status: 'open',
    dogFileNo: 'KD-2026-036',
    details: [
      { label: 'Requested', value: 'Thu 29 Oct, 14:00' },
      { label: 'Where', value: 'Buyer\'s gate, Maitama' },
      { label: 'Dog', value: 'Kaia · KD-2026-036' },
      { label: 'Handler', value: 'Not assigned yet' },
    ],
    actions: [
      { label: 'Confirm handover', done: 'Handover confirmed for Thu 29 Oct, 14:00', primary: true },
      { label: 'Suggest another time', done: 'Folake will be asked to pick another time' },
    ],
  },
  {
    id: 'payment-kaia',
    kind: 'payment',
    from: 'Dogeash escrow',
    subject: 'Deposit received for Kaia',
    preview: '₦250,000 held until handover is confirmed',
    at: 'Yesterday',
    unread: false,
    status: 'open',
    dogFileNo: 'KD-2026-036',
    details: [
      { label: 'Amount', value: '₦250,000' },
      { label: 'From', value: 'Folake A.' },
      { label: 'Held until', value: 'Handover is confirmed by both sides' },
      { label: 'Released to', value: 'Your payout account, 2 working days after' },
    ],
    actions: [{ label: 'Plan handover', done: '', to: '/dashboard/bookings', primary: true }],
  },
  {
    id: 'review-femi',
    kind: 'review',
    from: 'Femi A.',
    city: 'Ikoyi, Lagos',
    subject: '5 stars after handover',
    preview: '"The two-day handover was worth it on its own."',
    at: '2 days',
    unread: false,
    status: 'open',
    details: [{ label: 'Rating', value: '★★★★★' }, { label: 'Dog', value: 'Nova' }],
    actions: [{ label: 'Thank them publicly', done: 'Your thank-you will show under the review', primary: true }],
  },
  {
    id: 'msg-chinedu',
    kind: 'message',
    from: 'Chinedu E.',
    city: 'Enugu',
    subject: 'Delivery to Enugu',
    preview: 'You: Yes, we deliver to Enugu with the handler. It adds two days.',
    at: '3 days',
    unread: false,
    status: 'replied',
    channels: ['email'],
    thread: [
      { from: 'buyer', name: 'Chinedu E.', text: 'Do you deliver to Enugu? I\'m interested in a level 4 dog.', at: 'Fri 16:20' },
      { from: 'store', name: 'K9 Guardian Kennels', text: 'Yes, we deliver to Enugu with the handler. It adds two days.', at: 'Fri 17:02' },
    ],
  },
  {
    id: 'update-onyx',
    kind: 'update',
    from: 'Dogeash',
    subject: 'Booster due for Onyx',
    preview: 'Rabies booster due 14 November. Update the K9 file after.',
    at: '4 days',
    unread: false,
    status: 'open',
    dogFileNo: 'KD-2026-046',
    actions: [{ label: 'Update K9 file', done: '', to: '/dashboard/dogs', primary: true }],
  },
]

// Ready-made replies for buyer messages
export const quickReplies = [
  'Yes, still available.',
  'You\'re welcome to visit. Which day suits you?',
  'I\'ll check with our trainer and get back to you today.',
]
