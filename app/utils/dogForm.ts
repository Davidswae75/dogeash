import { z } from 'zod'
import type { FieldConfig } from '~/components/Fields.vue'
import type { Database } from '~/types/database.types'
import type { Dog, DogMedia } from './dogs'
import { hipGrades, sexes } from './k9'

// The dashboard's add / edit dog form: what a store fills in, checked the same way the database
// checks it (lengths, weight, price). It covers what buyers see on a dog's card and its page.
// The file number and the "inspected" line are Dogeash's, so they aren't here.

const optional = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`).default('')

export const dogFormSchema = z.object({
  name: z.string().trim().min(1, 'Give the dog\'s name').max(40, 'Keep the name under 40 characters'),
  breed: z.string().trim().min(2, 'Choose the breed'),
  sex: z.enum(sexes, { message: 'Choose male or female' }),
  age: z.string().trim().min(1, 'Give the age, like "2 years"').max(30),
  born: optional(120),
  weightKg: z.coerce.number({ message: 'Weight in kg, like 32' }).min(5, 'Weight in kg, like 32').max(120, 'That\'s heavier than any guard dog'),
  city: z.string().trim().min(2, 'Which city is the dog in?').max(60),
  level: z.number({ message: 'Choose a protection level' }).int().min(1).max(5),
  property: z.array(z.enum(['home', 'compound', 'estate', 'business'])).min(1, 'Choose at least one place the dog suits'),
  safeWithChildren: z.boolean(),
  hips: z.enum(hipGrades),
  hipsElbows: optional(160),
  microchip: optional(40),
  vaccinations: optional(200),
  titles: optional(160),
  sire: optional(120),
  dam: optional(120),
  summary: z.string().trim().min(20, 'Write at least a sentence about the dog (20 characters)').max(600, 'Keep the summary under 600 characters'),
  bestSuited: optional(200),
  traits: z.array(z.string().trim().min(1).max(30)).max(6, 'Up to 6 traits'),
  priceNaira: z.coerce.number({ message: 'Price in naira, like 2500000' }).int('Whole naira only').min(1, 'Price in naira, like 2500000').max(1_000_000_000),
})
export type DogFormValues = z.infer<typeof dogFormSchema>

export const emptyDogForm = (city = ''): Partial<DogFormValues> => ({
  sex: undefined,
  city,
  property: [],
  safeWithChildren: false,
  hips: 'Not tested',
  traits: [],
})

export const dogFormFromDog = (d: Omit<Dog, 'status'>): DogFormValues => ({
  name: d.name,
  breed: d.breed,
  sex: d.sex,
  age: d.age,
  born: d.file?.born ?? '',
  weightKg: d.weightKg,
  city: d.city,
  level: d.level,
  property: d.property,
  safeWithChildren: d.safeWithChildren,
  hips: d.hips,
  hipsElbows: d.file?.hipsElbows ?? '',
  microchip: d.file?.microchip ?? '',
  vaccinations: d.file?.vaccinations ?? '',
  titles: d.file?.titles ?? '',
  sire: d.file?.sire ?? '',
  dam: d.file?.dam ?? '',
  summary: d.file?.summary ?? '',
  bestSuited: d.file?.bestSuited ?? '',
  traits: d.file?.traits ?? [],
  priceNaira: d.priceNaira,
})

type DogWrite = Database['public']['Tables']['dogs']['Update']

// Form values and media → the dogs table's columns (status and store are set by whoever saves)
export const dogFormToRow = (v: DogFormValues, media: DogMedia): DogWrite => ({
  name: v.name,
  breed: v.breed,
  sex: v.sex,
  age: v.age,
  weight_kg: v.weightKg,
  city: v.city,
  level: v.level,
  property: v.property,
  safe_with_children: v.safeWithChildren,
  hips: v.hips,
  price_naira: v.priceNaira,
  photo_path: media.photoPath,
  gallery_paths: media.gallery,
  videos: media.videos,
  file: {
    summary: v.summary,
    born: v.born,
    hipsElbows: v.hipsElbows,
    microchip: v.microchip,
    vaccinations: v.vaccinations,
    titles: v.titles,
    sire: v.sire,
    dam: v.dam,
    bestSuited: v.bestSuited,
    traits: v.traits,
  },
})

// Text fields, in the groups the form shows them
const input = (name: keyof DogFormValues, label: string, placeholder: string, extra: Partial<FieldConfig> = {}): FieldConfig =>
  ({ fieldType: 'input', name, label, attrs: { placeholder, ...extra.attrs }, ...extra } as FieldConfig)

export const dogFormFields = {
  basics: [
    input('name', 'Name', 'Rambo', { attrs: { autocomplete: 'off', maxlength: 40 } }),
    input('age', 'Age', '2.5 years'),
    input('born', 'Born', '12 February 2024, K9 Guardian Kennels', { hint: 'Date and where, if you know it.', optional: true }),
    input('weightKg', 'Weight', '32', { attrs: { inputmode: 'decimal' }, hint: 'In kilograms.' }),
    input('city', 'City', 'Abuja', { hint: 'Where buyers meet the dog.' }),
  ],
  health: [
    input('hipsElbows', 'Hips and elbows, in full', 'Hips A1 / elbows normal, SV certified', { optional: true }),
    input('vaccinations', 'Vaccinations', 'Full puppy series; annual booster due February 2027', { optional: true }),
    input('microchip', 'Microchip', '985 112 004 716 204', { optional: true }),
  ],
  training: [
    input('titles', 'Titles and training', 'IGP-3 (obedience, tracking, protection)', { optional: true }),
    input('sire', 'Sire (father)', 'V Django vom Wolfsbane (NL)', { optional: true }),
    input('dam', 'Dam (mother)', 'Xira des Guerriers Belges (BE)', { optional: true }),
  ],
  listing: [
    input('bestSuited', 'Best suited to', 'Gated estates with an experienced handler', { optional: true }),
    input('priceNaira', 'Price', '3,200,000', { prefix: '₦', money: true, attrs: { inputmode: 'numeric' }, hint: 'Whole naira.' }),
  ],
}
