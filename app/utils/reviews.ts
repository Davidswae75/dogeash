import { z } from 'zod'
import type { StoreReview } from './stores'

// Store reviews (Supabase: store_reviews). Buyers review a store after a done kennel visit; the store replies.
// Sample stores also carry example reviews (`reviewSamples`), shown until a store has real ones.
export interface Review {
  id: string
  storeId: string // the store's public id, like STR-001
  name: string
  city: string
  rating: number
  text: string
  at: string
  reply: string | null
  repliedAt: string | null
  mine: boolean
}

// Visitors may not read the author's account id; signed-in people need it to spot their own review
export const reviewColumns = (signedIn: boolean) =>
  `id, ${signedIn ? 'author_id, ' : ''}author_name, author_city, rating, body, store_reply, replied_at, created_at, stores!inner (public_id)`

export interface ReviewRow {
  id: string
  author_id?: string
  author_name: string
  author_city: string
  rating: number
  body: string
  store_reply: string | null
  replied_at: string | null
  created_at: string
  stores: { public_id: string }
}

export const toReview = (r: ReviewRow, userId?: string): Review => ({
  id: r.id,
  storeId: r.stores.public_id,
  name: r.author_name || 'A buyer',
  city: r.author_city,
  rating: r.rating,
  text: r.body,
  at: r.created_at,
  reply: r.store_reply,
  repliedAt: r.replied_at,
  mine: !!userId && r.author_id === userId,
})

// An example review in the same shape, for stores with no real reviews yet
export const sampleReview = (r: StoreReview, storeId: string): Review => ({
  id: `sample-${r.name}-${r.date}`,
  storeId,
  name: r.name,
  city: r.city,
  rating: r.rating,
  text: r.text,
  at: r.date,
  reply: null,
  repliedAt: null,
  mine: false,
})

// "Nov 2026" for a real review; sample reviews already carry a label
export const reviewDate = (at: string) => (/^\d{4}-/.test(at) ? new Date(at).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }) : at)

export const reviewSchema = z.object({
  rating: z.number({ message: 'Choose 1 to 5 stars' }).int().min(1, 'Choose 1 to 5 stars').max(5),
  text: z.string().trim().min(20, 'Write at least a sentence (20 characters)').max(1000, 'Keep it under 1,000 characters'),
})
export type ReviewValues = z.infer<typeof reviewSchema>

export const ratingWords = ['', 'Poor', 'Below what I expected', 'Fine', 'Good', 'Excellent'] as const
