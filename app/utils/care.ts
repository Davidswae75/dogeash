// Care network: vets, trainers, groomers, kennel builders, equipment suppliers and boarding.
// Each provider exists once (Supabase: care_providers); stores link to the ones they work with
// (store_care_links, read into Store.care).
import { shallowRef } from 'vue'

export type CareType = 'vet' | 'trainer' | 'groomer' | 'builder' | 'equipment' | 'boarding'

// `relationship`: what a store usually calls one on its care team
export const careTypes: Record<CareType, { label: string, relationship: string, services: string[] }> = {
  vet: { label: 'Vet', relationship: 'Our vet', services: ['Health check', 'Vaccination', 'Microchip scan', 'Tick and worm treatment'] },
  trainer: { label: 'Trainer', relationship: 'Our handover trainer', services: ['Handover session', 'Refresher training', 'Obedience course'] },
  groomer: { label: 'Grooming and cleaning', relationship: 'Grooming and kennel cleaning', services: ['Bath and groom', 'Kennel deep clean', 'Tick treatment wash'] },
  builder: { label: 'Kennel builder', relationship: 'Kennel runs we install', services: ['Site visit and quote', 'Kennel run install'] },
  equipment: { label: 'Equipment', relationship: 'Equipment we use', services: ['Harness and collar fitting', 'Muzzle fitting', 'Gear consultation'] },
  boarding: { label: 'Boarding', relationship: 'Boarding we recommend', services: ['Overnight stay', 'Week-long stay'] },
}

export interface CareProvider {
  id: string
  name: string
  person?: string
  type: CareType
  city: string
  areas: string
  homeVisits: boolean
  verified: boolean
  credential: string
  rating: number
  reviews: number
  priceFrom: number
  // Written by the provider once they manage the listing; bookings follow their days and times
  about?: string
  hours?: string
  weekdays?: number[]
  slots?: string[]
  takingBookings?: boolean
  /** Shown to buyers; Dogeash can keep a listing hidden while it's set up */
  listed?: boolean
  /** What they offer (more than one, from any kind of care); empty means their kind's usual services */
  services?: string[]
  /** How many bookings one time can take */
  slotCapacity?: number
  // Photos (URLs, and the storage paths behind them), the workplace, when they started and milestones
  photo?: string
  photoPath?: string | null
  gallery?: string[]
  galleryPaths?: string[]
  address?: string
  startedYear?: number | null
  history?: CareMilestone[]
  // The people who work there, shown as "Our team"
  team?: CareTeamPerson[]
}
export interface CareMilestone { year: string, text: string }
export interface CareTeamPerson { name: string, role: string, photoPath: string | null, photo?: string }
// The phone, WhatsApp and email: only for signed-in people (care_provider_contacts)
export interface CareContacts { phone: string, whatsapp: string, email: string }

// Example providers: the fallback when the database can't be reached, and what `npm run db:seed` writes
export const sampleCareProviders: CareProvider[] = [
  { id: 'CARE-01', name: 'Kuje Veterinary Clinic', person: 'Dr. Halima Sani', type: 'vet', city: 'Abuja', areas: 'Abuja and environs', homeVisits: true, verified: true, credential: 'VCN registered veterinary surgeon', rating: 4.9, reviews: 132, priceFrom: 15_000 },
  { id: 'CARE-02', name: 'Steelpaw Training', person: 'Sgt. (rtd) Emeka Obi', type: 'trainer', city: 'Abuja', areas: 'Nationwide, travels to you', homeVisits: true, verified: true, credential: 'Former Police K9 handler', rating: 4.8, reviews: 74, priceFrom: 45_000 },
  { id: 'CARE-03', name: 'Fortress Kennels & Runs', type: 'builder', city: 'Abuja', areas: 'Abuja, Ibadan, Lagos', homeVisits: true, verified: true, credential: 'Registered business, Dogeash checked', rating: 4.6, reviews: 31, priceFrom: 350_000 },
  { id: 'CARE-04', name: 'Lekki Pet & Livestock Hospital', person: 'Dr. Tobi Adeyemi', type: 'vet', city: 'Lagos', areas: 'Lekki, Ajah, Victoria Island', homeVisits: false, verified: true, credential: 'VCN registered veterinary surgeon', rating: 4.7, reviews: 210, priceFrom: 20_000 },
  { id: 'CARE-05', name: 'CleanCoat Mobile Grooming', type: 'groomer', city: 'Lagos', areas: 'Lagos Island and Lekki', homeVisits: true, verified: false, credential: 'Listed, not yet checked', rating: 4.5, reviews: 18, priceFrom: 12_000 },
  { id: 'CARE-06', name: 'K9 Gear Nigeria', type: 'equipment', city: 'Lagos', areas: 'Ships nationwide', homeVisits: false, verified: true, credential: 'Registered business, Dogeash checked', rating: 4.6, reviews: 57, priceFrom: 8_000 },
  { id: 'CARE-07', name: 'Garden City Vets', person: 'Dr. Ibiere George', type: 'vet', city: 'Port Harcourt', areas: 'Port Harcourt and Obio-Akpor', homeVisits: true, verified: true, credential: 'VCN registered veterinary surgeon', rating: 4.8, reviews: 96, priceFrom: 18_000 },
  { id: 'CARE-08', name: 'Bodija Animal Clinic', person: 'Dr. Folake Ojo', type: 'vet', city: 'Ibadan', areas: 'Ibadan', homeVisits: true, verified: true, credential: 'VCN registered veterinary surgeon', rating: 4.7, reviews: 88, priceFrom: 12_000 },
  { id: 'CARE-09', name: 'Sahel Veterinary Services', person: 'Dr. Aminu Bello', type: 'vet', city: 'Kano', areas: 'Kano and Kaduna', homeVisits: true, verified: true, credential: 'VCN registered veterinary surgeon', rating: 4.6, reviews: 44, priceFrom: 10_000 },
]

// The care directory the site shows: read from Supabase on each page load (plugins/00.catalog.ts),
// or the samples if it can't be reached
export const listedProviders = shallowRef<CareProvider[]>(sampleCareProviders)

// A provider as it comes from Supabase (public.care_providers)
export interface CareRow {
  public_id: string
  name: string
  person: string | null
  type: CareType
  city: string
  areas: string
  home_visits: boolean
  verified: boolean
  credential: string
  rating: number
  reviews_count: number
  price_from: number
  about: string
  hours: string
  weekdays: number[]
  slots: string[]
  taking_bookings: boolean
  listed: boolean
  services: string[]
  slot_capacity: number
  photo_path?: string | null
  gallery_paths?: string[]
  address?: string
  started_year?: number | null
  history?: CareMilestone[]
  team?: { name: string, role: string, photo: string | null }[]
}
export const careColumns = 'public_id, name, person, type, city, areas, home_visits, verified, credential, rating, reviews_count, price_from, about, hours, weekdays, slots, taking_bookings, listed, services, slot_capacity, photo_path, gallery_paths, address, started_year, history, team'

// Providers' photos live in the public care-media bucket, one folder per provider
export const careMediaUrl = (path: string | null | undefined, storageUrl: string) =>
  (path && storageUrl ? `${storageUrl}/storage/v1/object/public/care-media/${path}` : undefined)

export const toCareProvider = (r: CareRow, storageUrl = ''): CareProvider => ({
  id: r.public_id,
  name: r.name,
  person: r.person ?? undefined,
  type: r.type,
  city: r.city,
  areas: r.areas,
  homeVisits: r.home_visits,
  verified: r.verified,
  credential: r.credential,
  rating: Number(r.rating),
  reviews: r.reviews_count,
  priceFrom: Number(r.price_from),
  about: r.about ?? '',
  hours: r.hours ?? '',
  weekdays: r.weekdays ?? undefined,
  slots: r.slots ?? undefined,
  takingBookings: r.taking_bookings ?? true,
  listed: r.listed ?? true,
  services: r.services ?? [],
  slotCapacity: r.slot_capacity ?? 1,
  photoPath: r.photo_path ?? null,
  photo: careMediaUrl(r.photo_path, storageUrl),
  galleryPaths: r.gallery_paths ?? [],
  gallery: (r.gallery_paths ?? []).map(p => careMediaUrl(p, storageUrl)).filter((u): u is string => !!u),
  address: r.address ?? '',
  startedYear: r.started_year ?? null,
  history: Array.isArray(r.history) ? r.history : [],
  team: (Array.isArray(r.team) ? r.team : []).map(t => ({ name: t.name, role: t.role ?? '', photoPath: t.photo ?? null, photo: careMediaUrl(t.photo, storageUrl) })),
})

// "12 years" since they started, or nothing
export const yearsActive = (p: CareProvider) => (p.startedYear ? Math.max(0, new Date().getFullYear() - p.startedYear) : null)

// What a provider offers: their own list, or their kind's usual services until they set one
export const providerServices = (p: CareProvider) => (p.services?.length ? p.services : careTypes[p.type].services)

// Every service providers can choose from, grouped by kind of care (the provider's listing page)
export const careServiceGroups = (Object.keys(careTypes) as CareType[]).map(k => ({ type: k, label: careTypes[k].label, services: careTypes[k].services }))

// "Mon to Sat · 9:00 to 17:00": when they take bookings, in one line
const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function scheduleLine(p: CareProvider) {
  const days = [...(p.weekdays ?? [1, 2, 3, 4, 5, 6])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  const run = days.length > 2 && days.every((d, i) => i === 0 || (days[i - 1]! + 1) % 7 === d)
  const dayText = run ? `${dayShort[days[0]!]} to ${dayShort[days[days.length - 1]!]}` : days.map(d => dayShort[d]).join(', ')
  const slots = [...(p.slots ?? ['9:00', '17:00'])].sort((a, b) => Number(a.replace(':', '.')) - Number(b.replace(':', '.')))
  const timeText = slots.length > 1 ? `${slots[0]} to ${slots[slots.length - 1]}` : slots[0] ?? ''
  return [dayText, timeText].filter(Boolean).join(' · ')
}

export function findCareProvider(id: string) {
  return listedProviders.value.find(p => p.id === id)
}

// Public address of a provider's page, made from its name
export function careProviderSlug(provider: CareProvider) {
  return provider.name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function findCareProviderBySlug(slug: string) {
  return listedProviders.value.find(p => careProviderSlug(p) === slug.toLowerCase())
}
