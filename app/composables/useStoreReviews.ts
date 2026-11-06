import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import type { Review, ReviewRow, ReviewValues } from '~/utils/reviews'
import { reviewColumns, toReview } from '~/utils/reviews'
import { useNotify } from './useNotify'
import { useSession } from './useSession'
import { useVisits } from './useVisits'

// Store reviews (Supabase: store_reviews). Anyone reads a store's reviews; a buyer writes one per store
// after a done kennel visit there, and can edit or delete it; the store's owners and managers reply.
// Stores are addressed by public id (STR-001). Writes return an error message, or null when they worked.
export function useStoreReviews() {
  const supabase = useSupabaseClient()
  const { user } = useSession()
  const visits = useVisits()
  const byStore = useState<Record<string, Review[]>>('store-reviews', () => ({}))

  async function load(storeId: string) {
    const { data } = await supabase.from('store_reviews').select(reviewColumns(!!user.value)).eq('stores.public_id', storeId).order('created_at', { ascending: false })
    byStore.value = { ...byStore.value, [storeId]: ((data ?? []) as unknown as ReviewRow[]).map(r => toReview(r, user.value?.id)) }
    return byStore.value[storeId]!
  }

  // The signed-in buyer's own reviews across every store, with the store's name and page (Reviews page)
  const mine = useState<(Review & { storeName: string, storeSlug: string, repliedAt: string | null })[]>('my-reviews', () => [])
  async function loadMine() {
    if (!user.value) return (mine.value = [])
    const { data } = await supabase
      .from('store_reviews')
      .select('id, author_id, author_name, author_city, rating, body, store_reply, replied_at, created_at, stores!inner (public_id, name, slug)')
      .eq('author_id', user.value.id)
      .order('created_at', { ascending: false })
    type Row = ReviewRow & { stores: { public_id: string, name: string, slug: string } }
    mine.value = ((data ?? []) as unknown as Row[]).map(r => ({ ...toReview(r, user.value?.id), storeName: r.stores.name, storeSlug: r.stores.slug, repliedAt: r.replied_at }))
  }

  const reviewsOf = (storeId: string) => computed(() => byStore.value[storeId] ?? [])
  const mineFor = (storeId: string) => computed(() => byStore.value[storeId]?.find(r => r.mine))
  // A done visit with the store makes a buyer eligible (until purchases exist)
  const canReview = (storeId: string) => computed(() => !!user.value && visits.mine.value.some(v => v.storeId === storeId && v.status === 'done'))

  async function write(storeId: string, storeName: string, values: ReviewValues): Promise<string | null> {
    const existing = byStore.value[storeId]?.find(r => r.mine)
    if (existing) {
      const { error } = await supabase.from('store_reviews').update({ rating: values.rating, body: values.text }).eq('id', existing.id)
      if (error) return 'Your review didn\'t save. Try again.'
    }
    else {
      const { data: store } = await supabase.from('stores').select('id').eq('public_id', storeId).maybeSingle()
      if (!store) return 'This store isn\'t taking reviews.'
      const { error } = await supabase.from('store_reviews').insert({ store_id: store.id, rating: values.rating, body: values.text })
      if (error) return error.message.includes('after a visit') ? 'You can review a store after a visit there.' : error.code === '23505' ? 'You\'ve already reviewed this store.' : 'Your review didn\'t save. Try again.'
    }
    await Promise.all([load(storeId), loadMine()])
    useNotify().reviewSaved(existing ? 'Review updated' : 'Review posted', `Thanks. Buyers see it on ${storeName}'s page.`)
    return null
  }

  async function remove(review: Review) {
    const { error } = await supabase.from('store_reviews').delete().eq('id', review.id)
    if (error) return void useNotify().failed('That didn\'t work. Try again.')
    await Promise.all([load(review.storeId), loadMine()])
    useNotify().reviewSaved('Review deleted', 'It no longer shows on the store\'s page.')
  }

  // The store's reply, from the dashboard (empty text removes it)
  async function reply(review: Review, text: string): Promise<string | null> {
    const { error } = await supabase.from('store_reviews').update({ store_reply: text.trim() || null }).eq('id', review.id)
    if (error) return error.message.includes('check') ? 'Keep the reply under 1,000 characters.' : 'Your reply didn\'t save. Try again.'
    await load(review.storeId)
    useNotify().reviewSaved(text.trim() ? 'Reply posted' : 'Reply removed', text.trim() ? `${review.name} sees it, and so does everyone reading your reviews.` : 'The review shows without a reply.')
    return null
  }

  return { load, mine, loadMine, reviewsOf, mineFor, canReview, write, remove, reply }
}
