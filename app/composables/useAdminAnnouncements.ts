import { useState, useSupabaseClient } from '#imports'

// Admin › Announcements: send one to everyone, stores or buyers (admin_send_announcement()), see the ones sent,
// and take a site strip down early (admin_end_banner())
export type Audience = 'everyone' | 'stores' | 'buyers'
export interface Announcement { id: string, audience: Audience, title: string, body: string, link: string | null, banner_until: string | null, recipients: number, created_at: string, sent_by: string | null }

export function useAdminAnnouncements() {
  const supabase = useSupabaseClient()
  const sent = useState<Announcement[]>('admin-announcements', () => [])
  const loaded = useState('admin-announcements-loaded', () => false)

  async function load() {
    const { data } = await supabase.rpc('admin_announcements')
    sent.value = (data as unknown as Announcement[] | null) ?? []
    loaded.value = true
  }

  // Returns how many people got it, or an error message
  async function send(a: { audience: Audience, title: string, body: string, link: string, bannerUntil: string | null }): Promise<number | string> {
    const { data, error } = await supabase.rpc('admin_send_announcement', { audience: a.audience, title: a.title, body: a.body, link: a.link || null, banner_until: a.bannerUntil })
    if (error) return error.message.includes('link') ? 'Links must start with / (a page on Dogeash) or https://.' : 'It didn\'t send. Check the title and message (3 characters or more) and try again.'
    await load()
    return data as number
  }

  async function endBanner(a: Announcement): Promise<string | null> {
    const { error } = await supabase.rpc('admin_end_banner', { target: a.id })
    if (error) return 'That strip isn\'t showing.'
    await load()
    return null
  }

  return { sent, loaded, load, send, endBanner }
}
