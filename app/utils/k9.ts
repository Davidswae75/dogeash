import { z } from 'zod'
import type { Dog } from './dogs'

// The full K9 profile: everything a kennel lists, Dogeash inspects and a buyer reads.
// Zod schemas are the single source of truth: types are inferred from them, and the
// same schemas validate store forms (vee-validate + @vee-validate/zod) and API payloads.

// ── Option lists ────────────────────────────────────────────────────────────

export const breeds = [
  'Belgian Malinois', 'German Shepherd', 'Dutch Shepherd', 'Rottweiler', 'Doberman Pinscher', 'Presa Canario',
  'Cane Corso', 'Boerboel', 'Bullmastiff', 'Caucasian Shepherd', 'Kangal', 'Giant Schnauzer', 'Mixed',
] as const
export const sexes = ['Male', 'Female'] as const
export const listingStatuses = ['draft', 'pending_review', 'available', 'reserved', 'sold', 'withdrawn'] as const
// FCI grades (A1 best … E) as used by Nigerian and European kennels, plus OFA wording
export const hipGrades = ['A1', 'A2', 'B1', 'B2', 'C', 'D', 'E', 'Excellent', 'Good', 'Fair', 'Borderline', 'Not tested'] as const
export const elbowGrades = ['Normal', 'Grade 1', 'Grade 2', 'Grade 3', 'Not tested'] as const
export const geneticResults = ['Clear', 'Carrier', 'Affected', 'Not tested'] as const
export const coatLengths = ['short', 'medium', 'long'] as const
export const sizeClasses = ['medium', 'large', 'giant'] as const
export const registries = ['KCN', 'FCI', 'SV', 'AKC', 'KC', 'None'] as const
export const handlerExperience = ['first-time', 'some', 'experienced', 'professional'] as const
export const proficiencies = ['learning', 'reliable', 'competition'] as const
export const photoKinds = ['profile', 'stack', 'gait', 'face', 'bitework', 'with-family', 'kennel'] as const
export const deliveryMethods = ['pickup', 'local-delivery', 'nationwide', 'air-cargo'] as const

export const obedienceCommands = [
  'sit', 'down', 'stay', 'heel', 'recall', 'place', 'leave-it', 'off-leash-heel', 'send-away', 'out',
] as const
export const protectionSkills = [
  'alert-bark', 'perimeter-patrol', 'night-patrol', 'hold-and-bark', 'handler-protection',
  'vehicle-protection', 'muzzle-work', 'hidden-sleeve', 'out-on-command', 'threat-discrimination',
  'gunfire-steady', 'multiple-decoys',
] as const
export const titleCodes = ['BH', 'IGP 1', 'IGP 2', 'IGP 3', 'KNPV', 'Mondioring 1', 'Mondioring 2', 'Mondioring 3', 'PSA 1', 'PSA 2', 'PSA 3', 'CGC'] as const

// ── Building blocks ─────────────────────────────────────────────────────────

const isoDate = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Use YYYY-MM or YYYY-MM-DD')
const score = z.number().int().min(1).max(5) // 1 low … 5 high
const naira = z.number().int().nonnegative()
const hex = z.string().regex(/^#[0-9a-f]{6}$/i)

export const parentSchema = z.object({
  name: z.string().min(1),
  registrationNo: z.string().optional(),
  titles: z.array(z.string()).default([]),
  hips: z.enum(hipGrades).optional(),
  fileNo: z.string().optional(), // when the parent is also listed on Dogeash
})

export const vaccinationSchema = z.object({
  name: z.string(), // e.g. DHPPi+L, Rabies
  date: isoDate,
  nextDue: isoDate.optional(),
  vet: z.string().optional(),
})

export const vetCheckSchema = z.object({
  date: isoDate,
  clinic: z.string(),
  vetName: z.string(),
  weightKg: z.number().positive(),
  notes: z.string().default(''),
  documentUrl: z.string().url().optional(),
})

export const commandSchema = z.object({
  command: z.enum(obedienceCommands),
  proficiency: z.enum(proficiencies),
  languages: z.array(z.enum(['English', 'German', 'Dutch', 'Yoruba', 'Hausa', 'Igbo', 'Pidgin'])).default(['English']),
})

export const titleSchema = z.object({
  code: z.enum(titleCodes),
  year: z.number().int().min(2000),
  judge: z.string().optional(),
  score: z.number().optional(),
})

export const photoSchema = z.object({
  url: z.string(),
  alt: z.string().min(1),
  kind: z.enum(photoKinds),
  takenOn: isoDate.optional(),
})

export const videoSchema = z.object({
  url: z.string(),
  title: z.string(),
  kind: z.enum(['obedience', 'bitework', 'temperament', 'health', 'other']),
  durationSec: z.number().int().positive().optional(),
})

// Drives GuardDog3D so each profile can show its own dog
export const appearanceSchema = z.object({
  coat: hex,
  saddle: hex, // back overlay
  mask: hex, // muzzle, ears, paws
  eyes: hex,
  coatLength: z.enum(coatLengths),
  ears: z.enum(['erect', 'cropped', 'drop']),
  tail: z.enum(['long', 'docked']),
})

// Any bite or aggression event, including on-command work outside training.
// Required on every profile: an empty list is a declaration of "none known".
export const incidentSchema = z.object({
  date: isoDate,
  kind: z.enum(['bite', 'attempted-bite', 'aggression', 'dog-fight']),
  onCommand: z.boolean(), // false = the dog acted on its own
  victim: z.enum(['family-member', 'visitor', 'intruder', 'child', 'dog', 'other-animal', 'decoy']),
  severity: z.enum(['no-contact', 'contact-no-puncture', 'puncture', 'hospital']),
  description: z.string().min(10),
  reportedBy: z.string(),
  verifiedByDogeash: z.boolean(),
})

// ── Profile sections ────────────────────────────────────────────────────────

export const identitySchema = z.object({
  fileNo: z.string().regex(/^KD-\d{4}-\d{3}$/, 'Format KD-2026-000'),
  name: z.string().min(1).max(40),
  callName: z.string().optional(),
  breed: z.enum(breeds),
  sex: z.enum(sexes),
  born: isoDate,
  neutered: z.boolean(),
  microchip: z.string().regex(/^\d{3} ?\d{3} ?\d{3} ?\d{3} ?\d{3}$/, '15-digit ISO chip'),
  sizeClass: z.enum(sizeClasses),
  weightKg: z.number().positive(),
  heightCm: z.number().positive(), // at the withers
})

export const pedigreeSchema = z.object({
  registry: z.enum(registries),
  registrationNo: z.string().optional(),
  sire: parentSchema,
  dam: parentSchema,
  breeder: z.string(),
  litterSize: z.number().int().positive().optional(),
  imported: z.object({ from: z.string(), year: z.number().int() }).optional(),
})

export const healthSchema = z.object({
  hips: z.enum(hipGrades),
  elbows: z.enum(elbowGrades),
  hipsCertificate: z.string().optional(), // e.g. OFA / SV a-stamp number
  degenerativeMyelopathy: z.enum(geneticResults),
  eyes: z.enum(['Clear', 'Issue noted', 'Not tested']),
  heart: z.enum(['Clear', 'Murmur', 'Not tested']),
  vaccinations: z.array(vaccinationSchema),
  dewormedOn: isoDate.optional(),
  tickTreatmentOn: isoDate.optional(),
  vetChecks: z.array(vetCheckSchema),
  knownConditions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  diet: z.object({ food: z.string(), mealsPerDay: z.number().int().positive(), gramsPerDay: z.number().positive() }),
})

// Scores are what the Dogeash inspector observed, not what the kennel claims
export const temperamentSchema = z.object({
  withChildren: score,
  withDogs: score,
  withCats: score,
  withStrangers: score, // 1 aloof/suspicious … 5 friendly
  energy: score,
  defenceDrive: score,
  preyDrive: score,
  nerveStability: score, // recovery from sudden noise, footing, crowds
  trainability: score,
  handlerSoftness: score, // 1 needs a firm handler … 5 forgiving
  summary: z.string().min(20),
})

export const trainingSchema = z.object({
  protectionLevel: z.number().int().min(1).max(5),
  trainer: z.object({ name: z.string(), organisation: z.string().optional(), phoneVerified: z.boolean() }),
  hoursLogged: z.number().nonnegative(),
  commands: z.array(commandSchema),
  protectionSkills: z.array(z.enum(protectionSkills)),
  titles: z.array(titleSchema),
  environments: z.array(z.enum(['traffic', 'crowds', 'markets', 'stairs', 'vehicles', 'water', 'gunfire', 'night'])),
})

export const suitabilitySchema = z.object({
  properties: z.array(z.enum(['home', 'compound', 'estate', 'business'])).min(1),
  minHandlerExperience: z.enum(handlerExperience),
  safeWithChildren: z.boolean(),
  canLiveWithOtherDogs: z.boolean(),
  minYardSqm: z.number().nonnegative(),
  indoorOk: z.boolean(),
  heatTolerance: score,
  bestSuited: z.string(),
})

export const listingSchema = z.object({
  status: z.enum(listingStatuses),
  priceNaira: naira,
  depositNaira: naira,
  negotiable: z.boolean(),
  priceIncludes: z.array(z.enum(['K9 file', 'handover training', 'crate', 'starter food', 'vet transfer', 'collar and lead', 'microchip registration'])),
  installments: z.object({ months: z.number().int().min(2).max(12), monthlyNaira: naira }).optional(),
  publishedAt: isoDate.optional(),
  views: z.number().int().nonnegative().default(0),
  saves: z.number().int().nonnegative().default(0),
})

export const deliverySchema = z.object({
  city: z.string(),
  state: z.string(),
  methods: z.array(z.enum(deliveryMethods)).min(1),
  feeEstimateNaira: naira.optional(),
  leadTimeDays: z.number().int().nonnegative(),
})

export const handoverSchema = z.object({
  trainingDays: z.number().int().nonnegative(), // trainer works with the family at the gate
  supportDays: z.number().int().nonnegative(),
  followUpVisits: z.number().int().nonnegative(),
  returnPolicyDays: z.number().int().nonnegative(),
  ownerCourse: z.boolean(),
})

export const inspectionSchema = z.object({
  inspectedOn: isoDate,
  inspector: z.string(),
  verified: z.boolean(),
  score: z.number().min(0).max(100),
  checks: z.object({
    identityMatchesChip: z.boolean(),
    healthPapersSeen: z.boolean(),
    temperamentTested: z.boolean(),
    protectionTested: z.boolean(),
    kennelConditions: z.enum(['excellent', 'good', 'acceptable', 'poor']),
  }),
  notes: z.string().default(''),
  nextInspectionDue: isoDate.optional(),
})

export const reservationSchema = z.object({
  id: z.string(),
  buyerId: z.string(),
  depositPaidNaira: naira,
  reservedOn: isoDate,
  expiresOn: isoDate,
  handoverDate: isoDate.optional(),
})

// ── The full profile ────────────────────────────────────────────────────────

export const dogProfileSchema = z.object({
  id: z.string().uuid(), // database key; fileNo is the public number
  identity: identitySchema,
  storeId: z.string(),
  pedigree: pedigreeSchema,
  health: healthSchema,
  temperament: temperamentSchema,
  incidents: z.array(incidentSchema),
  training: trainingSchema,
  suitability: suitabilitySchema,
  listing: listingSchema,
  delivery: deliverySchema,
  handover: handoverSchema,
  inspection: inspectionSchema.optional(), // absent until Dogeash has visited
  reservation: reservationSchema.optional(),
  media: z.object({
    photos: z.array(photoSchema),
    videos: z.array(videoSchema).default([]),
    appearance: appearanceSchema.optional(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// What a kennel submits: Dogeash fills inspection, reservation, stats and timestamps
export const dogSubmissionSchema = dogProfileSchema.omit({ id: true, inspection: true, reservation: true, createdAt: true, updatedAt: true })

export type DogProfile = z.infer<typeof dogProfileSchema>
export type DogSubmission = z.input<typeof dogSubmissionSchema>
export type DogIncident = z.infer<typeof incidentSchema>
export type DogAppearance = z.infer<typeof appearanceSchema>
export type ListingStatus = (typeof listingStatuses)[number]

// ── Helpers ─────────────────────────────────────────────────────────────────

// "2 yrs" / "18 mo", matching the card copy
export function ageLabel(born: string, now = new Date()) {
  const [y, m] = born.split('-').map(Number)
  const months = (now.getFullYear() - y!) * 12 + (now.getMonth() + 1 - m!)
  return months < 24 ? `${months} mo` : `${Math.floor(months / 12)} yrs`
}

export function vaccinationsDue(profile: DogProfile, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  return profile.health.vaccinations.filter(v => v.nextDue && v.nextDue <= today)
}

// Unprompted bites are what a buyer most needs to see
export function hasUnpromptedBite(p: DogProfile) {
  return p.incidents.some(i => !i.onCommand && i.kind === 'bite')
}

// Collapse a full profile into the card shape the listing grid already uses.
// Returns null for dogs that must not be shown as buyable (draft, in review, sold, withdrawn).
export function toDogCard(p: DogProfile): Dog | null {
  const { status } = p.listing
  if (status !== 'available' && status !== 'reserved') return null
  return {
    fileNo: p.identity.fileNo,
    name: p.identity.name,
    breed: p.identity.breed,
    sex: p.identity.sex,
    city: p.delivery.city,
    age: ageLabel(p.identity.born),
    weightKg: p.identity.weightKg,
    hips: p.health.hips,
    level: p.training.protectionLevel as Dog['level'],
    priceNaira: p.listing.priceNaira,
    status,
    photo: p.media.photos.find(ph => ph.kind === 'profile')?.url,
    property: p.suitability.properties,
    safeWithChildren: p.suitability.safeWithChildren,
    storeId: p.storeId,
  }
}

// ── Example ─────────────────────────────────────────────────────────────────

export const sampleProfile: DogProfile = {
  id: '3f6c2a1e-8b4d-4c7a-9e21-5d0b7a4f1c93',
  identity: { fileNo: 'KD-2026-070', name: 'Kaiser', breed: 'Belgian Malinois', sex: 'Male', born: '2024-06', neutered: false, microchip: '985 112 004 731 920', sizeClass: 'large', weightKg: 31, heightCm: 64 },
  storeId: 'STR-001',
  pedigree: {
    registry: 'KCN',
    registrationNo: 'KCN-MAL-24-0193',
    sire: { name: 'Axel v. Falke', titles: ['IGP 3'], hips: 'Excellent' },
    dam: { name: 'Freya v. Falke', titles: ['IGP 2'], hips: 'Good' },
    breeder: 'K9 Guardian Kennels',
    litterSize: 7,
  },
  health: {
    hips: 'Good', elbows: 'Normal', hipsCertificate: 'OFA BS-12345G24M', degenerativeMyelopathy: 'Clear', eyes: 'Clear', heart: 'Clear',
    vaccinations: [
      { name: 'DHPPi+L', date: '2026-03-02', nextDue: '2027-03-02', vet: 'Wuse Vet Clinic' },
      { name: 'Rabies', date: '2026-03-02', nextDue: '2027-03-02', vet: 'Wuse Vet Clinic' },
    ],
    dewormedOn: '2026-09-15',
    tickTreatmentOn: '2026-10-01',
    vetChecks: [{ date: '2026-08-20', clinic: 'Wuse Vet Clinic', vetName: 'Dr A. Bello', weightKg: 31, notes: 'Fit for sale. No findings.' }],
    knownConditions: [],
    allergies: [],
    diet: { food: 'Royal Canin Maxi Adult', mealsPerDay: 2, gramsPerDay: 420 },
  },
  temperament: {
    withChildren: 5, withDogs: 4, withCats: 3, withStrangers: 2, energy: 5, defenceDrive: 4, preyDrive: 5,
    nerveStability: 5, trainability: 5, handlerSoftness: 3,
    summary: 'Raised in a home with two children and a cat. Calm indoors, alert on the perimeter. Clear off-switch.',
  },
  incidents: [],
  training: {
    protectionLevel: 4,
    trainer: { name: 'Emeka Obi', organisation: 'K9 Guardian Kennels', phoneVerified: true },
    hoursLogged: 620,
    commands: [
      { command: 'heel', proficiency: 'competition', languages: ['German'] },
      { command: 'recall', proficiency: 'reliable', languages: ['German', 'English'] },
      { command: 'out', proficiency: 'competition', languages: ['German'] },
      { command: 'place', proficiency: 'reliable', languages: ['English'] },
    ],
    protectionSkills: ['alert-bark', 'night-patrol', 'hold-and-bark', 'handler-protection', 'out-on-command', 'threat-discrimination'],
    titles: [{ code: 'BH', year: 2025 }, { code: 'IGP 2', year: 2026, score: 268 }],
    environments: ['traffic', 'crowds', 'vehicles', 'night'],
  },
  suitability: {
    properties: ['home', 'compound'], minHandlerExperience: 'some', safeWithChildren: true, canLiveWithOtherDogs: true,
    minYardSqm: 150, indoorOk: true, heatTolerance: 4, bestSuited: 'Home or compound, 1 dog',
  },
  listing: {
    status: 'available', priceNaira: 2_400_000, depositNaira: 500_000, negotiable: false,
    priceIncludes: ['K9 file', 'handover training', 'crate', 'starter food', 'vet transfer'],
    publishedAt: '2026-08-28', views: 1240, saves: 87,
  },
  delivery: { city: 'Abuja', state: 'FCT', methods: ['pickup', 'local-delivery', 'nationwide'], feeEstimateNaira: 150_000, leadTimeDays: 5 },
  handover: { trainingDays: 3, supportDays: 30, followUpVisits: 2, returnPolicyDays: 14, ownerCourse: true },
  inspection: {
    inspectedOn: '2026-08-12', inspector: 'Dogeash K9 team', verified: true, score: 92,
    checks: { identityMatchesChip: true, healthPapersSeen: true, temperamentTested: true, protectionTested: true, kennelConditions: 'excellent' },
    notes: 'Strong grip, clean out. Settled within 20 s after gunfire test.',
    nextInspectionDue: '2027-02-12',
  },
  media: {
    photos: [],
    videos: [],
    appearance: { coat: '#c89048', saddle: '#5a3a1a', mask: '#2a2420', eyes: '#d98a1c', coatLength: 'short', ears: 'erect', tail: 'long' },
  },
  createdAt: '2026-08-10T09:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
}
