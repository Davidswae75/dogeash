// Care network: vets, trainers, groomers, kennel builders, equipment suppliers and boarding.
// Each provider exists once; stores link to the ones they work with (Store.care).

export type CareType = 'vet' | 'trainer' | 'groomer' | 'builder' | 'equipment' | 'boarding'

export const careTypes: Record<CareType, { label: string, services: string[] }> = {
  vet: { label: 'Vet', services: ['Health check', 'Vaccination', 'Microchip scan', 'Tick and worm treatment'] },
  trainer: { label: 'Trainer', services: ['Handover session', 'Refresher training', 'Obedience course'] },
  groomer: { label: 'Grooming and cleaning', services: ['Bath and groom', 'Kennel deep clean', 'Tick treatment wash'] },
  builder: { label: 'Kennel builder', services: ['Site visit and quote', 'Kennel run install'] },
  equipment: { label: 'Equipment', services: ['Harness and collar fitting', 'Muzzle fitting', 'Gear consultation'] },
  boarding: { label: 'Boarding', services: ['Overnight stay', 'Week-long stay'] },
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

// Example providers until the care directory and API exist
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

export function findCareProvider(id: string) {
  return sampleCareProviders.find(p => p.id === id)
}

// Public address of a provider's page, made from its name
export function careProviderSlug(provider: CareProvider) {
  return provider.name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function findCareProviderBySlug(slug: string) {
  return sampleCareProviders.find(p => careProviderSlug(p) === slug.toLowerCase())
}
