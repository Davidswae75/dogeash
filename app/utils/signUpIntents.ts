import type { Component } from 'vue'
import { BookOpen, CalendarCheck, ClipboardCheck, LayoutDashboard, Search, Store } from '@lucide/vue'
import type { AuthLinkCard } from '~/components/auth/AuthLinkCards.vue'
import type { AuthPanelMeta } from '~/types/page-meta'

// "What brings you here?" on sign-up. Each answer changes the heading, the fields, the side panel
// and where the welcome sends you. `store` is how a kennel opens a store on Dogeash (/sign-up?as=store).
export type SignUpIntent = 'buy' | 'care' | 'store'

export interface SignUpIntentCopy {
  value: SignUpIntent
  label: string
  icon: Component
  heading: { title: string, outline: string, text: string }
  submitLabel: string
  panel?: AuthPanelMeta
  welcome: (names: { storeName: string }) => string
  nextSteps: AuthLinkCard[]
}

const buyerNextSteps: AuthLinkCard[] = [
  { to: '/dogs', title: 'Find a guard dog', text: 'Browse dogs from inspected kennels by protection level and city.', icon: Search },
  { to: '/guide', title: 'Read the buyer\'s guide', text: 'What a guard dog does for your home, what it costs, and the risks.', icon: BookOpen },
  { to: '/stores', title: 'Meet the stores', text: 'Every kennel, its owner, its history and its vets.', icon: Store },
]

export const signUpIntents: SignUpIntentCopy[] = [
  {
    value: 'buy',
    label: 'Buy a guard dog',
    icon: Search,
    heading: { title: 'Create an', outline: 'account', text: 'Save dogs, message stores and book kennel visits. Free, and it takes a minute.' },
    submitLabel: 'Create account',
    welcome: () => 'This is a preview: accounts aren\'t connected yet, so nothing was saved. Here\'s where you\'d go next.',
    nextSteps: buyerNextSteps,
  },
  {
    value: 'care',
    label: 'Book a vet or trainer',
    icon: CalendarCheck,
    heading: { title: 'Create an', outline: 'account', text: 'Book vets, trainers and groomers who work with Dogeash kennels, and keep your dog\'s record in one place.' },
    submitLabel: 'Create account',
    welcome: () => 'This is a preview: accounts aren\'t connected yet, so nothing was saved. Here\'s where you\'d go next.',
    nextSteps: [
      { to: '/stores', title: 'Find a store\'s care team', text: 'Each store lists the vets and trainers it works with.', icon: Store },
      { to: '/account/dogs', title: 'Add your dog\'s record', text: 'Vaccinations, training and reminders in one place.', icon: ClipboardCheck },
      buyerNextSteps[1]!,
    ],
  },
  {
    value: 'store',
    label: 'Open a store',
    icon: Store,
    heading: { title: 'Open your', outline: 'store', text: 'Start with your account and your kennel\'s name. You\'ll add your documents and book the inspection next; nothing goes public until it passes.' },
    submitLabel: 'Create account and start my store',
    panel: {
      variant: 'night',
      title: 'Your kennel,',
      outline: 'inspected.',
      text: 'Stores on Dogeash are kennels we have visited in person. Buyers see your record before they ever call.',
    },
    welcome: ({ storeName }) => `${storeName} is saved as a draft store. This is a preview, so nothing was sent. Next you'd add your documents and book the inspection.`,
    nextSteps: [
      { to: '/dashboard', title: 'Set up your store', text: 'Store profile, your dogs and your care team, in the store dashboard.', icon: LayoutDashboard },
      { to: '/open-a-store#verification', title: 'How verification works', text: 'Apply, inspection visit, go live, stay verified.', icon: ClipboardCheck },
    ],
  },
]

export const findSignUpIntent = (value: unknown) =>
  signUpIntents.find(i => i.value === value) ?? signUpIntents[0]!
