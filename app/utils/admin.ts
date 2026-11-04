// The admin dashboard: its sections, and the overview the database sends (public.admin_overview()).
// Sections not built yet are listed without a link, so the shape of the dashboard is visible.
// `badge` names the overview count shown beside a section (what's waiting there).
export const adminNav: { group: string, items: { to?: string, label: string, icon: string, badge?: 'storesInReview' | 'dogsPendingReview' }[] }[] = [
  { group: 'Monitor', items: [
    { to: '/admin', label: 'Overview', icon: 'LayoutDashboard' },
    { label: 'Audit log', icon: 'ScrollText' },
  ] },
  { group: 'Review', items: [
    { label: 'Applications', icon: 'FileCheck2', badge: 'storesInReview' },
    { label: 'Inspections', icon: 'ClipboardCheck' },
    { label: 'Listings', icon: 'Dog', badge: 'dogsPendingReview' },
    { label: 'Reviews', icon: 'Star' },
  ] },
  { group: 'Manage', items: [
    { label: 'Stores', icon: 'Store' },
    { label: 'People', icon: 'Users' },
    { label: 'Care directory', icon: 'Stethoscope' },
  ] },
]

type ByStatus = Partial<Record<string, number>>

export interface AdminOverview {
  accounts: number
  accountsWeek: number
  stores: ByStatus
  dogs: ByStatus
  visits: ByStatus
  visitsWeek: number
  conversationsWeek: number
  messagesWeek: number
  reviews: number
  reviewsWeek: number
  rating: number | null
  careProviders: number
  staff: number
  waiting: { storesInReview: number, dogsPendingReview: number, visitsUnanswered: number, reviewsUnanswered: number }
  series: SeriesDay[]
  topStores: { public_id: string, name: string, city: string, rating: number, reviews_count: number, live_dogs: number, visits_30: number }[]
  cities: { city: string, dogs: number }[]
  newest: {
    stores: { public_id: string, name: string, city: string, status: string, created_at: string }[]
    reviews: { id: string, store: string, rating: number, body: string, created_at: string }[]
  }
}

// One day of activity (Lagos time) in the overview's 60-day series
export type Metric = 'accounts' | 'visits' | 'messages' | 'reviews' | 'dogs'
export type SeriesDay = { day: string } & Record<Metric, number>

export const metrics: { key: Metric, label: string, unit: string }[] = [
  { key: 'accounts', label: 'New accounts', unit: 'accounts' },
  { key: 'visits', label: 'Visit requests', unit: 'visits' },
  { key: 'messages', label: 'Messages', unit: 'messages' },
  { key: 'reviews', label: 'Reviews', unit: 'reviews' },
]
// What the activity chart can show: the headline measures and new dog listings
export const chartMetrics = [...metrics, { key: 'dogs' as const, label: 'New dog listings', unit: 'listings' }]

// A period's total and the one before it, for "+12% vs the previous 30 days"
export function periodTotals(series: SeriesDay[], metric: Metric, days: number) {
  const now = series.slice(-days).reduce((sum, d) => sum + d[metric], 0)
  const before = series.slice(-2 * days, -days).reduce((sum, d) => sum + d[metric], 0)
  const change = before ? Math.round(((now - before) / before) * 100) : null
  return { now, before, change }
}

// A round top for an axis (4, 10, 20, 50, 100 …) and the ticks under it
export function niceTicks(max: number, count = 4) {
  if (max <= count) return Array.from({ length: count + 1 }, (_, i) => i)
  const raw = max / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw)!
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step * 100) / 100)
}

// "4 Nov" for chart axes and tooltips
export const shortDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })

export interface AuditEntry { id: number, actor_name: string, action: string, target_type: string, target_id: string, detail: Record<string, unknown>, created_at: string }

// Counts with thousands separators, the way they're read aloud
export const count = (n: number | null | undefined) => (n ?? 0).toLocaleString('en-NG')
export const sumOf = (by: ByStatus, ...keys: string[]) => keys.reduce((total, k) => total + (by[k] ?? 0), 0)

// "4 Nov, 14:05" for the audit log and tables
export const adminTime = (iso: string) => new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })

// ── Stores (admin_stores(), admin_set_store_status()) ───────────────────────
export type StoreStatus = 'draft' | 'in_review' | 'verified' | 'suspended'

export interface AdminStore {
  public_id: string
  slug: string
  name: string
  city: string
  status: StoreStatus
  status_note: string
  status_changed_at: string | null
  created_at: string
  rating: number
  reviews_count: number
  owner: string | null
  dogs: number
  live_dogs: number
}

// How each status reads, and its colour (the same validated hues as the Supply chart)
export const storeStatusMeta: Record<StoreStatus, { label: string, color: string }> = {
  verified: { label: 'Verified', color: 'var(--cat-1)' },
  in_review: { label: 'In review', color: 'var(--cat-2)' },
  draft: { label: 'Draft', color: 'var(--cat-3)' },
  suspended: { label: 'Suspended', color: 'var(--cat-4)' },
}

// What an admin can do from each status. `reason`: the store must be told why.
export const storeActions: Record<StoreStatus, { to: StoreStatus, label: string, reason: boolean, tone: 'go' | 'stop' | 'plain' }[]> = {
  in_review: [
    { to: 'verified', label: 'Approve', reason: false, tone: 'go' },
    { to: 'draft', label: 'Decline (send back)', reason: true, tone: 'stop' },
  ],
  draft: [
    { to: 'in_review', label: 'Mark in review', reason: false, tone: 'plain' },
    { to: 'verified', label: 'Approve', reason: false, tone: 'go' },
  ],
  verified: [
    { to: 'suspended', label: 'Suspend', reason: true, tone: 'stop' },
    { to: 'draft', label: 'Send back to draft', reason: true, tone: 'stop' },
  ],
  suspended: [
    { to: 'verified', label: 'Restore', reason: false, tone: 'go' },
    { to: 'draft', label: 'Send back to draft', reason: true, tone: 'stop' },
  ],
}

// What happens to the store, said before the admin confirms
export const storeActionEffect: Record<StoreStatus, string> = {
  verified: 'The store and its live dogs show to buyers, and it can put dogs live. Its page shows it as inspected.',
  in_review: 'The store stays hidden from buyers while Dogeash reviews it.',
  draft: 'The store is hidden from buyers and goes back to its owner to fix. It can\'t put dogs live.',
  suspended: 'The store and all its dogs disappear from the site at once. Its people can still sign in and see why.',
}
