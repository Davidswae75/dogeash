// The admin dashboard: its sections, and the overview the database sends (public.admin_overview()).
// Sections not built yet are listed without a link, so the shape of the dashboard is visible.
// `badge` names the overview count shown beside a section (what's waiting there).
// `inspector`: also shown to inspectors (everything else is admins only)
export const adminNav: { group: string, items: { to?: string, label: string, icon: string, badge?: 'storesInReview' | 'dogsPendingReview', inspector?: boolean }[] }[] = [
  { group: 'Monitor', items: [
    { to: '/admin', label: 'Overview', icon: 'LayoutDashboard' },
    { to: '/admin/audit', label: 'Audit log', icon: 'ScrollText' },
  ] },
  { group: 'Review', items: [
    { to: '/admin/applications', label: 'Applications', icon: 'FileCheck2', badge: 'storesInReview' },
    { to: '/admin/inspections', label: 'Inspections', icon: 'ClipboardCheck', inspector: true },
    { to: '/admin/listings', label: 'Listings', icon: 'Dog', badge: 'dogsPendingReview' },
    { to: '/admin/reviews', label: 'Reviews', icon: 'Star' },
  ] },
  { group: 'Manage', items: [
    { to: '/admin/stores', label: 'Stores', icon: 'Store' },
    { to: '/admin/people', label: 'People', icon: 'Users' },
    { to: '/admin/care', label: 'Care directory', icon: 'Stethoscope' },
  ] },
]

// Pages an inspector may open (the one-time code page, and their inspections)
export const inspectorPaths = ['/admin/verify', '/admin/inspections']
export const inspectorMayOpen = (path: string) => inspectorPaths.some(p => path === p || path.startsWith(`${p}/`))

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

// ── Listings (admin_dogs(), admin_set_dog_status()) ─────────────────────────
export type DogStatus = 'draft' | 'pending_review' | 'available' | 'reserved' | 'sold' | 'withdrawn'

export interface AdminDog {
  id: string
  file_no: string
  name: string
  breed: string
  city: string
  level: number
  price_naira: number
  status: DogStatus
  photo_path: string | null
  admin_note: string
  created_at: string
  updated_at: string
  store_id: string
  store_name: string
  store_status: StoreStatus
}

export const dogStatusMeta: Record<DogStatus, { label: string, color: string }> = {
  available: { label: 'For sale', color: 'var(--cat-1)' },
  reserved: { label: 'Reserved', color: 'var(--cat-2)' },
  pending_review: { label: 'Pending review', color: 'var(--cat-3)' },
  draft: { label: 'Draft', color: 'var(--line-strong)' },
  sold: { label: 'Sold', color: 'var(--cat-4)' },
  withdrawn: { label: 'Withdrawn', color: 'var(--cat-5)' },
}

// What an admin can do with a listing in each status (drafts and sold dogs are the store's business)
export const dogActions: Record<DogStatus, { to: DogStatus, label: string, reason: boolean, effect: string }[]> = {
  available: [{ to: 'withdrawn', label: 'Take down', reason: true, effect: 'The dog disappears from the site at once. The store sees your reason on the dog.' }],
  reserved: [{ to: 'withdrawn', label: 'Take down', reason: true, effect: 'The dog disappears from the site at once. The store sees your reason on the dog.' }],
  withdrawn: [{ to: 'available', label: 'Put back live', reason: false, effect: 'Buyers can see the dog again (its store must be verified).' }],
  pending_review: [
    { to: 'available', label: 'Approve and put live', reason: false, effect: 'Buyers can see the dog straight away (its store must be verified).' },
    { to: 'draft', label: 'Send back to the store', reason: true, effect: 'The dog goes back to the store as a draft, with your reason.' },
  ],
  draft: [],
  sold: [],
}

// ── Reviews (admin_reviews(), admin_remove_review()) ────────────────────────
export interface AdminReview {
  id: string
  rating: number
  body: string
  store_reply: string | null
  replied_at: string | null
  created_at: string
  author_name: string
  author_city: string
  author_email: string | null
  store_id: string
  store_name: string
  store_slug: string
}

// ── People (admin_people()) ─────────────────────────────────────────────────
export interface AdminPerson {
  id: string
  name: string
  email: string | null
  phone: string | null
  city: string | null
  created_at: string
  last_sign_in_at: string | null
  staff_role: 'admin' | 'inspector' | null
  stores: { id: string, name: string, status: StoreStatus, role: 'owner' | 'manager' | 'handler' }[]
  visits: number
  conversations: number
  reviews: number
  shortlisted: number
}

// ── Audit log (admin_audit) ─────────────────────────────────────────────────
// Kinds of action, by the start of their name ("store.verified", "dog.withdrawn" …)
export const auditKinds = [
  { prefix: 'store.', label: 'Stores' },
  { prefix: 'dog.', label: 'Listings' },
  { prefix: 'review.', label: 'Reviews' },
  { prefix: 'care.', label: 'Care directory' },
  { prefix: 'inspection.', label: 'Inspections' },
]

// "store.verified" → "Store approved", for the log
const auditWords: Record<string, string> = {
  'store.verified': 'Store approved', 'store.draft': 'Store sent back', 'store.in_review': 'Store marked in review', 'store.suspended': 'Store suspended',
  'dog.withdrawn': 'Listing taken down', 'dog.available': 'Listing put live', 'dog.draft': 'Listing sent back',
  'review.remove': 'Review removed',
  'inspection.schedule': 'Inspection booked', 'inspection.pass': 'Inspection passed', 'inspection.fail': 'Inspection failed', 'inspection.cancel': 'Inspection cancelled', 'care.add': 'Provider added', 'care.edit': 'Provider edited', 'care.remove': 'Provider removed',
}
export const auditLabel = (action: string) => auditWords[action] ?? action

// ── Applications (admin_applications()) ─────────────────────────────────────
export interface AdminApplication {
  public_id: string
  name: string
  city: string
  area: string
  state: string
  status: StoreStatus
  status_note: string
  tagline: string
  about: string | null
  owner_profile: { name?: string, title?: string, yearsWithDogs?: number, credentials?: string[] } | null
  created_at: string
  address: string
  directions: string
  contact_phone: string
  preferred_days: string[]
  cac_registered: boolean
  note: string
  id_doc_path: string | null
  cac_doc_path: string | null
  address_doc_path: string | null
  submitted_at: string | null
  updated_at: string
  owner: { name: string, email: string, phone: string | null } | null
  dogs: number
}
