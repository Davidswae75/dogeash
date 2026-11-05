import { useState, useSupabaseClient } from '#imports'
import type { AdminReview } from '~/utils/admin'

// Admin › Reviews: every review (admin_reviews()), and removing one with a reason (admin_remove_review())
export function useAdminReviews() {
  const supabase = useSupabaseClient()
  const reviews = useState<AdminReview[]>('admin-reviews', () => [])
  const loaded = useState('admin-reviews-loaded', () => false)

  async function load() {
    const { data } = await supabase.rpc('admin_reviews')
    reviews.value = (data as unknown as AdminReview[] | null) ?? []
    loaded.value = true
  }

  async function remove(review: AdminReview, note: string): Promise<string | null> {
    const { error } = await supabase.rpc('admin_remove_review', { target: review.id, note })
    if (error) return error.message.includes('reason') ? 'Give the author a reason.' : 'That didn\'t work. Try again.'
    reviews.value = reviews.value.filter(r => r.id !== review.id)
    return null
  }

  return { reviews, loaded, load, remove }
}
