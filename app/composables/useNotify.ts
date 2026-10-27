import { CalendarCheck, CircleX, Heart, HeartOff, Info, LogIn, LogOut, MessageSquare, Scale, Store, TriangleAlert, UserRoundCheck } from '@lucide/vue'
import type { Component } from 'vue'
import { TYPE, useToast } from 'vue-toastification'
import ToastContent, { type ToastAction, type ToastTone } from '~/components/ToastContent.vue'
import type { Dog } from '~/utils/dogs'
import type { InboxChannel } from '~/utils/inbox'

// Every toast in the app goes through here, so the same action always looks and reads the same.
// Tones: success (marigold) for things done, info (ash) for neutral changes and undo,
// warning (marigold) for limits and heads-ups, error (red) for failures.
interface Message { kicker: string, meta?: string, title: string, text?: string, image?: string, action?: ToastAction }

const TIMEOUT: Record<ToastTone, number> = { success: 4200, info: 6000, warning: 6000, error: 7000 }

export function useNotify() {
  const { count } = useShortlist()

  function show(tone: ToastTone, icon: Component, message: Message) {
    // Toasts only exist in the browser; ignore calls made while rendering on the server
    if (import.meta.server) return
    useToast()(
      { component: ToastContent, props: { ...message, tone, icon: markRaw(icon) } },
      { type: tone as TYPE, icon: false, timeout: TIMEOUT[tone] },
    )
  }

  const saved = () => `${count.value} saved`
  const viewShortlist: ToastAction = { label: 'View shortlist', onClick: () => navigateTo('/shortlist') }
  const movedText = (moved: number) => moved ? `${moved} saved ${moved === 1 ? 'dog' : 'dogs'} from this browser ${moved === 1 ? 'is' : 'are'} now in your account.` : undefined
  const aboutDog = (dog: Dog) => `${dog.breed} · ${dog.sex} · ${formatNaira(dog.priceNaira)}`

  return {
    success: (m: Message) => show('success', CalendarCheck, m),
    info: (m: Message) => show('info', Info, m),
    warning: (m: Message) => show('warning', TriangleAlert, m),
    error: (m: Message) => show('error', CircleX, m),

    shortlistSaved: (dog: Dog) => dog.status === 'reserved'
      ? show('warning', Heart, { kicker: 'Shortlist', meta: saved(), title: `${dog.name} is reserved`, text: 'Saved anyway. It stays on your shortlist in case the reservation falls through.', image: dog.photo, action: viewShortlist })
      : show('success', Heart, { kicker: 'Shortlist', meta: saved(), title: `${dog.name} saved`, text: aboutDog(dog), image: dog.photo, action: viewShortlist }),

    shortlistRemoved: (dog: Dog, undo: () => void) =>
      show('info', HeartOff, { kicker: 'Shortlist', meta: saved(), title: `${dog.name} removed`, text: aboutDog(dog), image: dog.photo, action: { label: 'Undo', onClick: undo, kind: 'undo' } }),

    compareFull: (max: number, dog: Dog) =>
      show('warning', Scale, { kicker: 'Compare', meta: `${max} of ${max}`, title: 'Compare is full', text: `Untick a dog to swap in ${dog.name}.`, action: { label: 'Compare now', onClick: () => navigateTo('/shortlist/compare') } }),

    bookingRequested: (withWhom: string, when: string) =>
      show('success', CalendarCheck, { kicker: 'Booking', meta: 'Preview', title: 'Request ready', text: `${withWhom} · ${when}. Nothing is sent yet.` }),

    // `moved`: shortlisted dogs carried over from this browser into the account
    signedIn: (firstName: string, moved: number) =>
      show('success', LogIn, { kicker: 'Account', meta: 'Signed in', title: `Welcome back, ${firstName}`, text: movedText(moved) ?? 'Your shortlist and bookings are where you left them.' }),

    accountCreated: (firstName: string, moved: number) =>
      show('success', UserRoundCheck, { kicker: 'Account', meta: 'New', title: `Welcome, ${firstName}`, text: movedText(moved) ?? 'Your account is ready. Save dogs and they\'ll follow you to any device.' }),

    storeStarted: (firstName: string, storeName: string) =>
      show('success', Store, { kicker: 'Store', meta: 'Draft', title: `Welcome, ${firstName}`, text: `${storeName} is saved as a draft. Next: your documents and the inspection.` }),

    messageSent: (storeName: string, replies: string) =>
      show('success', MessageSquare, { kicker: 'Message', meta: 'Preview', title: `Message to ${storeName} ready`, text: `They usually reply in ${replies}. Messages aren't sent until accounts are connected.` }),

    // A guest who has saved a few dogs: offer an account once, never blocking anything
    keepShortlist: (count: number, path: string) =>
      show('info', Heart, { kicker: 'Shortlist', meta: `${count} saved`, title: 'Keep your shortlist on any device', text: 'Create a free account and your saved dogs come with you.', action: { label: 'Create account', onClick: () => navigateTo({ path: '/sign-up', query: { redirect: path } }) } }),

    // Store inbox: the reply is saved in Dogeash; the buyer also hears by their chosen channels
    storeReplySent: (to: string, channels: InboxChannel[]) =>
      show('success', MessageSquare, { kicker: 'Inbox', meta: 'Preview', title: `Reply to ${to} sent`, text: channels.length ? `Saved in Dogeash. ${to} also gets it by ${channels.map(c => channelLabels[c]).join(' and ')}.` : 'Saved in Dogeash.' }),

    storeActionDone: (text: string) =>
      show('success', CalendarCheck, { kicker: 'Inbox', meta: 'Preview', title: 'Done', text }),

    signedOut: () =>
      show('info', LogOut, { kicker: 'Account', meta: 'Signed out', title: 'You\'re signed out', text: 'Your saved dogs stay in your account for next time.' }),

    // `errors` is vee-validate's field → message map; the first message says what to fix
    formErrors: (errors: Partial<Record<string, string>>) => {
      const messages = Object.values(errors).filter(Boolean) as string[]
      show('error', CircleX, { kicker: 'Form', meta: `${messages.length} ${messages.length === 1 ? 'field' : 'fields'}`, title: messages.length === 1 ? 'One thing to fix' : `${messages.length} things to fix`, text: messages[0] })
    },
  }
}
