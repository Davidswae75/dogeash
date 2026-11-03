import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import { useSession } from './useSession'

// Conversations between buyers and stores (Supabase: conversations, messages), for both sides.
// Buyers see theirs in /account/messages; a store's owners and managers in the store inbox.
// The app speaks in store ids like STR-001 and dog file numbers; this translates to database ids.
export type MessageSide = 'buyer' | 'store'

export interface ConversationSummary {
  id: string
  storeId: string
  storeName: string
  storeSlug: string
  storeInitials: string
  dogFileNo: string | null
  buyerName: string
  lastAt: string
  preview: string
  lastSender: MessageSide | null
  unreadForBuyer: boolean
  unreadForStore: boolean
}

export interface ThreadMessage { id: string, from: MessageSide, body: string, at: string }

const columns = 'id, buyer_name, last_message_at, last_message_preview, last_sender, buyer_read_at, store_read_at, stores!inner (public_id, name, slug, initials), dogs (file_no)'

type Row = {
  id: string
  buyer_name: string
  last_message_at: string
  last_message_preview: string
  last_sender: MessageSide | null
  buyer_read_at: string
  store_read_at: string | null
  stores: { public_id: string, name: string, slug: string, initials: string }
  dogs: { file_no: string } | null
}

const toSummary = (r: Row): ConversationSummary => ({
  id: r.id,
  storeId: r.stores.public_id,
  storeName: r.stores.name,
  storeSlug: r.stores.slug,
  storeInitials: r.stores.initials,
  dogFileNo: r.dogs?.file_no ?? null,
  buyerName: r.buyer_name,
  lastAt: r.last_message_at,
  preview: r.last_message_preview,
  lastSender: r.last_sender,
  unreadForBuyer: r.last_sender === 'store' && r.last_message_at > r.buyer_read_at,
  unreadForStore: r.last_sender === 'buyer' && (!r.store_read_at || r.last_message_at > r.store_read_at),
})

export function useConversations() {
  const supabase = useSupabaseClient()
  const { user } = useSession()
  const mine = useState<ConversationSummary[]>('buyer-conversations', () => [])
  const unread = computed(() => mine.value.filter(c => c.unreadForBuyer).length)

  // The buyer's conversations, newest first
  async function loadMine() {
    if (!user.value) return (mine.value = [])
    const { data } = await supabase.from('conversations').select(columns).eq('buyer_id', user.value.id).order('last_message_at', { ascending: false })
    mine.value = ((data ?? []) as unknown as Row[]).map(toSummary)
  }

  // A store's conversations, for its inbox
  async function loadForStore(storeId: string) {
    const { data } = await supabase.from('conversations').select(columns).eq('stores.public_id', storeId).order('last_message_at', { ascending: false })
    return ((data ?? []) as unknown as Row[]).map(toSummary)
  }

  async function thread(id: string): Promise<ThreadMessage[]> {
    const { data } = await supabase.from('messages').select('id, sender_role, body, created_at').eq('conversation_id', id).order('created_at')
    return (data ?? []).map(m => ({ id: m.id, from: m.sender_role, body: m.body, at: m.created_at }))
  }

  async function send(id: string, as: MessageSide, body: string): Promise<string | null> {
    const { error } = await supabase.from('messages').insert({ conversation_id: id, sender_role: as, body: body.trim() })
    return error ? 'Your message didn\'t send. Check your connection and try again.' : null
  }

  // A buyer writing to a store, optionally about one dog: carries on the existing conversation or starts one.
  // Returns the conversation id, or an error message.
  async function start(storeId: string, dogFileNo: string | undefined, body: string): Promise<{ id?: string, error?: string }> {
    if (!user.value) return { error: 'Sign in to message stores.' }
    const { data: store } = await supabase.from('stores').select('id').eq('public_id', storeId).maybeSingle()
    if (!store) return { error: 'This store isn\'t taking messages yet.' }
    const { data: dog } = dogFileNo ? await supabase.from('dogs').select('id').eq('file_no', dogFileNo).maybeSingle() : { data: null }

    const existing = supabase.from('conversations').select('id').eq('store_id', store.id).eq('buyer_id', user.value.id)
    const { data: found } = await (dog ? existing.eq('dog_id', dog.id) : existing.is('dog_id', null)).maybeSingle()
    let id = found?.id
    if (!id) {
      const { data: created, error } = await supabase.from('conversations').insert({ store_id: store.id, dog_id: dog?.id ?? null }).select('id').single()
      if (error || !created) return { error: 'Your message didn\'t send. Try again.' }
      id = created.id
    }
    const error = await send(id, 'buyer', body)
    if (error) return { error }
    await loadMine()
    return { id }
  }

  async function markRead(id: string) {
    await supabase.rpc('mark_conversation_read', { target: id })
    mine.value = mine.value.map(c => (c.id === id ? { ...c, unreadForBuyer: false } : c))
  }

  return { mine, unread, loadMine, loadForStore, thread, send, start, markRead }
}
