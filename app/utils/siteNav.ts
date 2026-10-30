import type { Component } from 'vue'
import { BookOpen, ClipboardCheck, HandCoins, LayoutDashboard, LogIn, Package, Shield, Stethoscope, Store } from '@lucide/vue'

// The public site's navigation. The main links stay in the header; everything else sits in a menu named for what's in it.
export interface SiteNavLink { label: string, to: string, text: string, icon: Component }
export interface SiteNavGroup { label: string, links: SiteNavLink[] }

export const siteNavMain = [
  { label: 'Find a guard dog', to: '/dogs' },
  { label: 'Stores', to: '/stores' },
]

export const siteNavGroups = (hasStore: boolean): SiteNavGroup[] => [
  {
    label: 'Care and gear',
    links: [
      { label: 'Care', to: '/care', text: 'Vets, trainers and groomers near you', icon: Stethoscope },
      { label: 'Gear', to: '/gear', text: 'Harnesses, kennels and supplies', icon: Package },
    ],
  },
  {
    label: 'Learn',
    links: [
      { label: 'Protection levels', to: '/protection-levels', text: 'What each of the five levels will do', icon: Shield },
      { label: 'Buyer\'s guide', to: '/guide', text: 'The pros and cons of owning a guard dog', icon: BookOpen },
      { label: 'What it costs', to: '/guide#costs', text: 'Buying and keeping one, month by month', icon: HandCoins },
    ],
  },
  {
    label: 'For stores',
    links: [
      { label: 'Open a store', to: '/open-a-store', text: 'List your kennel on Dogeash', icon: Store },
      { label: 'How verification works', to: '/open-a-store#verification', text: 'Apply, inspection visit, go live', icon: ClipboardCheck },
      hasStore
        ? { label: 'Store dashboard', to: '/dashboard', text: 'Your dogs, inbox and bookings', icon: LayoutDashboard }
        : { label: 'Store sign in', to: '/sign-in?redirect=/dashboard', text: 'For kennels already on Dogeash', icon: LogIn },
    ],
  },
]
