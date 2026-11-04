import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import type { Database } from '~/types/database.types'
import { useSession } from './useSession'

// The header bell's notifications (Supabase: notifications). The database writes them when a store replies,
// answers a visit, or a shortlisted dog is reserved, sold, back on sale or cheaper; here we read the latest
// and mark them read. Loaded with the account, and again when the bell opens or every minute while it's on screen.
export type NotificationKind = Database['public']['Enums']['notification_kind']

export interface AccountNotification { id: string, kind: NotificationKind, title: string, text: string, to: string, at: string, unread: boolean }

export function useNotifications() {
  const supabase = useSupabaseClient()
  const { user } = useSession()
  const items = useState<AccountNotification[]>('account-notifications', () => [])
  const unread = computed(() => items.value.filter(n => n.unread).length)

  async function load() {
    if (!user.value) return (items.value = [])
    const { data } = await supabase.from('notifications').select('id, kind, title, body, link, read_at, created_at').order('created_at', { ascending: false }).limit(30)
    items.value = (data ?? []).map(r => ({ id: r.id, kind: r.kind, title: r.title, text: r.body, to: r.link, at: r.created_at, unread: !r.read_at }))
  }

  // Marks read here at once; the database catches up behind it
  async function markRead(ids: string[]) {
    if (!ids.length) return
    items.value = items.value.map(n => (ids.includes(n.id) ? { ...n, unread: false } : n))
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
  }
  const markAllRead = () => markRead(items.value.filter(n => n.unread).map(n => n.id))

  return { items, unread, load, markRead, markAllRead }
}
