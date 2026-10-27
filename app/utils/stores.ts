import type { ProtectionLevel } from './protection'
import { sampleDogs } from './dogs'

// A store is an inspected kennel listing guard dogs on Dogeash. Dogs link to it by storeId;
// care providers link to it through `care`.

export type StoreService = 'handover' | 'delivery' | 'boarding' | 'puppies' | 'imports' | 'training'

export const storeServices: Record<StoreService, { label: string, hint: string }> = {
  handover: { label: 'Handover at your gate', hint: 'A trainer delivers the dog and teaches your household the commands' },
  delivery: { label: 'Nationwide delivery', hint: 'Delivers outside its own state' },
  boarding: { label: 'Boarding', hint: 'Looks after your dog while you travel' },
  puppies: { label: 'Puppies', hint: 'Breeds and lists litters, not only trained adults' },
  imports: { label: 'Imported lines', hint: 'Brings in dogs or bloodlines from Europe' },
  training: { label: 'Training for your dog', hint: 'Trains dogs you already own' },
}

export interface StoreReview {
  name: string
  city: string
  date: string
  rating: number
  text: string
  dog?: string
}

export interface Store {
  id: string
  slug: string
  name: string
  initials: string
  tagline: string
  city: string
  area: string
  state: string
  founded: number
  verified: boolean
  rating: number
  reviews: number
  replies: string
  dogsPlaced: number
  hours: string
  deliveryAreas: string
  services: StoreService[]
  owner: {
    name: string
    title: string
    yearsWithDogs: number
    bio: string
    credentials: string[]
  }
  about: string
  history: { year: number, text: string }[]
  inspection: {
    status: 'passed' | 'booked'
    date: string
    by: string
    checks: string[]
  }
  care: { providerId: string, relationship: string }[]
  reviewSamples: StoreReview[]
}

// Example stores until the store dashboard and API exist
export const sampleStores: Store[] = [
  {
    id: 'STR-001',
    slug: 'k9-guardian-kennels',
    name: 'K9 Guardian Kennels',
    initials: 'KG',
    tagline: 'Titled working-line Malinois and Shepherds for executive homes',
    city: 'Abuja',
    area: 'Kuje',
    state: 'FCT',
    founded: 2014,
    verified: true,
    rating: 4.9,
    reviews: 84,
    replies: '~1 h',
    dogsPlaced: 212,
    hours: 'Mon–Sat, 8am–5pm. Visits by appointment.',
    deliveryAreas: 'Abuja, Kaduna, Lagos, Port Harcourt',
    services: ['handover', 'delivery', 'imports', 'training', 'boarding'],
    owner: {
      name: 'Col. (rtd) Ibrahim Danjuma',
      title: 'Founder and head trainer',
      yearsWithDogs: 26,
      bio: 'Ibrahim spent two decades with the Army K9 unit before founding the kennel. He still runs every protection assessment himself.',
      credentials: ['Former Army K9 unit instructor', 'IGP helper certified', 'SV breed warden course'],
    },
    about: 'A 4-acre kennel outside Abuja breeding and importing German and Belgian working lines. Every adult dog is titled or trained to IGP standard before it is listed, and every buyer gets a two-day handover at their gate.',
    history: [
      { year: 2014, text: 'Founded in Kuje with two imported German Shepherd females' },
      { year: 2017, text: 'First IGP-3 titled dog bred in the kennel' },
      { year: 2020, text: 'Added Belgian Malinois lines from the Netherlands and Belgium' },
      { year: 2023, text: 'Built a covered training field and a quarantine block' },
      { year: 2025, text: 'Joined Dogeash and passed its first kennel inspection' },
    ],
    inspection: {
      status: 'passed',
      date: 'November 2025',
      by: 'Dogeash inspection team',
      checks: ['Clean, shaded kennel runs', 'Vet records for every dog', 'Protection levels tested on site', 'Microchips scanned and matched'],
    },
    care: [
      { providerId: 'CARE-01', relationship: 'Our vet' },
      { providerId: 'CARE-02', relationship: 'Our handover trainer' },
      { providerId: 'CARE-03', relationship: 'Kennel runs we install' },
    ],
    reviewSamples: [
      { name: 'Aisha B.', city: 'Maitama', date: 'Aug 2026', rating: 5, dog: 'Sarge', text: 'The two-day handover was worth it on its own. Our driver and house staff all know the commands now.' },
      { name: 'Tunde O.', city: 'Asokoro', date: 'May 2026', rating: 5, dog: 'Rambo', text: 'Serious dog, serious kennel. They turned down our first choice because it did not suit our children, and they were right.' },
    ],
  },
  {
    id: 'STR-002',
    slug: 'naija-guard-dogs',
    name: 'Naija Guard Dogs',
    initials: 'NG',
    tagline: 'Family protection dogs raised around children',
    city: 'Lagos',
    area: 'Lekki',
    state: 'Lagos',
    founded: 2016,
    verified: true,
    rating: 4.8,
    reviews: 61,
    replies: '~2 h',
    dogsPlaced: 148,
    hours: 'Tue–Sun, 9am–6pm',
    deliveryAreas: 'Lagos, Ogun, Ibadan',
    services: ['handover', 'puppies', 'training', 'boarding'],
    owner: {
      name: 'Chiamaka Eze',
      title: 'Owner and breeder',
      yearsWithDogs: 14,
      bio: 'Chiamaka started breeding after her own family dog stopped a break-in. She focuses on calm, clear-headed dogs that live indoors with children.',
      credentials: ['KCN registered breeder', 'Canine behaviour diploma'],
    },
    about: 'A family-run kennel in Lekki raising Shepherds, Rottweilers and Cane Corsos inside the home. Puppies meet children, visitors and traffic before they leave.',
    history: [
      { year: 2016, text: 'First litter of German Shepherds raised at home in Lekki' },
      { year: 2019, text: 'Moved to a dedicated half-acre site with a puppy house' },
      { year: 2022, text: 'Started a family protection programme for adult dogs' },
      { year: 2026, text: 'Passed Dogeash kennel inspection' },
    ],
    inspection: {
      status: 'passed',
      date: 'February 2026',
      by: 'Dogeash inspection team',
      checks: ['Puppies socialised with children', 'Vet records for every dog', 'Clean water and shade', 'Microchips scanned and matched'],
    },
    care: [
      { providerId: 'CARE-04', relationship: 'Our vet' },
      { providerId: 'CARE-05', relationship: 'Grooming and cleaning' },
      { providerId: 'CARE-06', relationship: 'Equipment we use' },
    ],
    reviewSamples: [
      { name: 'Femi A.', city: 'Ikoyi', date: 'Jul 2026', rating: 5, dog: 'Nova', text: 'Nova sleeps outside our children\'s room and barks at the gate. Exactly the balance we asked for.' },
      { name: 'Grace N.', city: 'Ajah', date: 'Mar 2026', rating: 4, text: 'Great dog and honest advice. Delivery took a week longer than promised.' },
    ],
  },
  {
    id: 'STR-003',
    slug: 'niger-delta-k9',
    name: 'Niger Delta K9',
    initials: 'ND',
    tagline: 'Fast, driven dogs for compounds and oil-sector sites',
    city: 'Port Harcourt',
    area: 'GRA Phase 2',
    state: 'Rivers',
    founded: 2012,
    verified: true,
    rating: 4.7,
    reviews: 38,
    replies: '~3 h',
    dogsPlaced: 176,
    hours: 'Mon–Fri, 8am–4pm',
    deliveryAreas: 'Rivers, Enugu, Abia, Bayelsa',
    services: ['handover', 'delivery', 'training'],
    owner: {
      name: 'Tamuno Briggs',
      title: 'Managing director',
      yearsWithDogs: 18,
      bio: 'Tamuno supplied patrol dogs to industrial sites for years before opening the kennel to families. Two sites: Port Harcourt and Enugu.',
      credentials: ['Industrial K9 handler', 'PSA decoy certified'],
    },
    about: 'Two kennel sites in Port Harcourt and Enugu supplying Malinois, Dobermans and Rottweilers to homes, estates and industrial compounds across the South-South and South-East.',
    history: [
      { year: 2012, text: 'Started supplying patrol dogs to industrial sites' },
      { year: 2018, text: 'Opened to private homes and estates' },
      { year: 2021, text: 'Opened a second kennel site in Enugu' },
      { year: 2025, text: 'Passed Dogeash kennel inspection' },
    ],
    inspection: {
      status: 'passed',
      date: 'December 2025',
      by: 'Dogeash inspection team',
      checks: ['Both sites visited', 'Vet records for every dog', 'Protection levels tested on site', 'Microchips scanned and matched'],
    },
    care: [
      { providerId: 'CARE-07', relationship: 'Our vet' },
      { providerId: 'CARE-02', relationship: 'Refresher training partner' },
    ],
    reviewSamples: [
      { name: 'Ebiere T.', city: 'Port Harcourt', date: 'Jun 2026', rating: 5, dog: 'Diesel', text: 'Diesel patrols our yard every night. The team came back a month later to check on him at no charge.' },
    ],
  },
  {
    id: 'STR-004',
    slug: 'savanna-working-dogs',
    name: 'Savanna Working Dogs',
    initials: 'SW',
    tagline: 'Big, calm guardians for houses and compounds',
    city: 'Ibadan',
    area: 'Akobo',
    state: 'Oyo',
    founded: 2018,
    verified: true,
    rating: 4.8,
    reviews: 45,
    replies: '~2 h',
    dogsPlaced: 97,
    hours: 'Mon–Sat, 9am–5pm',
    deliveryAreas: 'Oyo, Ogun, Osun, Lagos',
    services: ['handover', 'puppies', 'boarding'],
    owner: {
      name: 'Adebayo Ogunleye',
      title: 'Owner',
      yearsWithDogs: 11,
      bio: 'A veterinary nurse turned breeder, Adebayo is known for steady, low-drama Rottweilers and Cane Corsos.',
      credentials: ['Veterinary nursing certificate', 'KCN registered breeder'],
    },
    about: 'A small kennel in Akobo focusing on Rottweilers, Cane Corsos and German Shepherds with strong nerves and a calm off-switch. Ideal for first-time guard dog owners.',
    history: [
      { year: 2018, text: 'First Rottweiler litter' },
      { year: 2021, text: 'Added Cane Corso and German Shepherd lines' },
      { year: 2026, text: 'Passed Dogeash kennel inspection' },
    ],
    inspection: {
      status: 'passed',
      date: 'February 2026',
      by: 'Dogeash inspection team',
      checks: ['Clean, shaded kennel runs', 'Vet records for every dog', 'Temperament tested with visitors', 'Microchips scanned and matched'],
    },
    care: [
      { providerId: 'CARE-08', relationship: 'Our vet' },
      { providerId: 'CARE-03', relationship: 'Kennel runs we recommend' },
    ],
    reviewSamples: [
      { name: 'Kemi L.', city: 'Bodija', date: 'Sep 2026', rating: 5, dog: 'Tank', text: 'First guard dog for us. Adebayo answered every question, even after we paid.' },
    ],
  },
  {
    id: 'STR-005',
    slug: 'northern-ridge-k9',
    name: 'Northern Ridge K9',
    initials: 'NR',
    tagline: 'Boerboels and Dutch Shepherds bred for heat and open land',
    city: 'Kano',
    area: 'Nassarawa GRA',
    state: 'Kano',
    founded: 2019,
    verified: true,
    rating: 4.6,
    reviews: 29,
    replies: '~4 h',
    dogsPlaced: 64,
    hours: 'Sat–Thu, 8am–4pm',
    deliveryAreas: 'Kano, Kaduna, Jos, Abuja',
    services: ['handover', 'delivery', 'puppies'],
    owner: {
      name: 'Musa Abdullahi',
      title: 'Founder',
      yearsWithDogs: 9,
      bio: 'Musa breeds for the northern climate: short coats, strong heat tolerance and dogs that cover large compounds and farms.',
      credentials: ['KCN registered breeder'],
    },
    about: 'A kennel in Kano breeding Boerboels and Dutch Shepherds for large compounds, farms and estates in the north, with partner handlers in Kaduna and Jos.',
    history: [
      { year: 2019, text: 'Founded with a Boerboel breeding pair' },
      { year: 2022, text: 'Added Dutch Shepherds for active protection work' },
      { year: 2025, text: 'Passed Dogeash kennel inspection' },
    ],
    inspection: {
      status: 'passed',
      date: 'October 2025',
      by: 'Dogeash inspection team',
      checks: ['Shade and water for hot season', 'Vet records for every dog', 'Microchips scanned and matched'],
    },
    care: [
      { providerId: 'CARE-09', relationship: 'Our vet' },
    ],
    reviewSamples: [
      { name: 'Hauwa M.', city: 'Kaduna', date: 'Apr 2026', rating: 4, dog: 'Cobra', text: 'Very fit, very fast dog. Ask for the handover session; it makes a difference.' },
    ],
  },
  {
    id: 'STR-006',
    slug: 'eastgate-k9-academy',
    name: 'Eastgate K9 Academy',
    initials: 'EK',
    tagline: 'Training academy now listing its own graduates',
    city: 'Enugu',
    area: 'Independence Layout',
    state: 'Enugu',
    founded: 2021,
    verified: false,
    rating: 0,
    reviews: 0,
    replies: '~6 h',
    dogsPlaced: 0,
    hours: 'Mon–Sat, 8am–6pm',
    deliveryAreas: 'Enugu, Anambra, Ebonyi',
    services: ['training', 'boarding'],
    owner: {
      name: 'Ngozi Okafor',
      title: 'Head trainer',
      yearsWithDogs: 8,
      bio: 'Ngozi runs obedience and protection courses for owners in the South-East and is preparing her first dogs for sale.',
      credentials: ['Canine behaviour diploma'],
    },
    about: 'A training academy in Enugu. Its dogs will appear here once Dogeash has inspected the kennel.',
    history: [
      { year: 2021, text: 'Opened as a training school for privately owned dogs' },
      { year: 2026, text: 'Applied to open a store on Dogeash' },
    ],
    inspection: {
      status: 'booked',
      date: 'November 2026',
      by: 'Dogeash inspection team',
      checks: [],
    },
    care: [],
    reviewSamples: [],
  },
]

export function findStore(slugOrId: string) {
  const key = slugOrId.toLowerCase()
  return sampleStores.find(s => s.slug === key || s.id.toLowerCase() === key)
}

// Dogs a buyer can see: listed and not sold or withdrawn
export function storeDogs(storeId: string) {
  return sampleDogs.filter(d => d.storeId === storeId)
}

export function storeSummary(store: Store) {
  const dogs = storeDogs(store.id)
  const levels = [...new Set(dogs.map(d => d.level))].sort() as ProtectionLevel[]
  return {
    dogs,
    available: dogs.filter(d => d.status === 'available').length,
    breeds: [...new Set(dogs.map(d => d.breed))],
    levels,
    cities: [...new Set([store.city, ...dogs.map(d => d.city)])],
    priceFrom: dogs.length ? Math.min(...dogs.map(d => d.priceNaira)) : undefined,
  }
}

// What a buyer can ask for when booking a kennel visit
export const kennelVisitServices = ['Meet the dogs', 'Meet the dogs and see protection work']
