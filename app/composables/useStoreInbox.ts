import type { InboxItem } from '~/utils/inbox'
import type { ConversationSummary } from './useConversations'
import type { Visit, VisitStatus } from './useVisits'
import { computed } from 'vue'
import { useState } from '#imports' // nuxt
import { useConversations } from './useConversations'
import { useNotify } from './useNotify'
import { useStoreContext } from './useStoreContext'
import { useVisits, visitDogNames } from './useVisits'
import { findDog } from '~/utils/dogs'
import { inboxKinds } from '~/utils/inbox'
import { visitDay } from '~/utils/time'

// The store inbox as one list: buyer conversations and visit requests for the store being run,
// filtered to what this person's role may see. Unread counts feed the bell and the sidebar.
const toMessage = (c: ConversationSummary): InboxItem => ({
  id: `c-${c.id}`,
  kind: 'message',
  from: c.buyerName,
  subject: (c.dogFileNo && findDog(c.dogFileNo)?.name) || 'General question',
  preview: `${c.lastSender === 'store' ? 'You: ' : ''}${c.preview}`,
  at: c.lastAt,
  unread: c.unreadForStore,
  status: c.lastSender === 'store' ? 'replied' : 'open',
  dogFileNo: c.dogFileNo ?? undefined,
  conversation: c,
})

const toVisit = (v: Visit): InboxItem => ({
  id: `v-${v.id}`,
  kind: 'booking',
  from: v.buyerName,
  subject: v.dogFileNos.length ? `Visit: ${visitDogNames(v.dogFileNos)}` : 'Kennel visit',
  preview: `${v.service} · ${visitDay(v.day).label}, ${v.slot}`,
  at: v.createdAt,
  unread: v.status === 'requested',
  status: v.status === 'requested' ? 'open' : 'done',
  dogFileNo: v.dogFileNos[0],
  visit: v,
})

const decided: Partial<Record<VisitStatus, string>> = { confirmed: 'Visit confirmed', declined: 'Visit declined', done: 'Marked as done' }

export function useStoreInbox() {
  const conversations = useState<ConversationSummary[]>('store-inbox-conversations', () => [])
  const visits = useState<Visit[]>('store-inbox-visits', () => [])
  const { membership, can } = useStoreContext()
  const chats = useConversations()
  const bookings = useVisits()
  const notify = useNotify()

  const items = computed(() =>
    [...conversations.value.map(toMessage), ...visits.value.map(toVisit)]
      .filter(i => can(inboxKinds[i.kind].permission))
      .sort((a, b) => b.at.localeCompare(a.at)),
  )
  const unread = computed(() => items.value.filter(i => i.unread).length)
  const find = (id: string) => items.value.find(i => i.id === id)

  async function load() {
    const storeId = membership.value?.store.id
    if (!storeId) return
    const [c, v] = await Promise.all([
      can('enquiries') ? chats.loadForStore(storeId) : [],
      can('bookings') ? bookings.loadForStore(storeId) : [],
    ])
    conversations.value = c
    visits.value = v
  }

  async function markRead(id: string) {
    const item = find(id)
    if (!item?.conversation || !item.unread) return
    await chats.markRead(item.conversation.id)
    conversations.value = conversations.value.map(c => (c.id === item.conversation!.id ? { ...c, unreadForStore: false } : c))
  }

  async function reply(id: string, text: string) {
    const item = find(id)
    if (!item?.conversation) return 'This conversation is gone.'
    const error = await chats.send(item.conversation.id, 'store', text)
    if (error) return error
    await load()
    notify.storeReplySent(item.from)
    return null
  }

  async function decide(id: string, status: VisitStatus, note?: string) {
    const item = find(id)
    if (!item?.visit) return
    const error = await bookings.setStatus(item.visit.id, status, note?.trim() || undefined)
    if (error) return void notify.failed(error)
    await load()
    notify.visitUpdated(decided[status] ?? 'Visit updated', `${item.from} · ${item.preview}. They see it in their visits.`)
  }

  return { items, unread, find, load, markRead, reply, decide }
}
