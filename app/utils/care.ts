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
}

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
}
export const careColumns = 'public_id, name, person, type, city, areas, home_visits, verified, credential, rating, reviews_count, price_from'

export const toCareProvider = (r: CareRow): CareProvider => ({
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
})

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
