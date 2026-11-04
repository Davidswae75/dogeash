import { z } from 'zod'
import type { FieldConfig } from '~/components/Fields.vue'
import type { Database } from '~/types/database.types'
import type { Store, StoreService } from './stores'
import { initialsOf } from './account'
import { storeServices } from './stores'

// The dashboard's store profile form: everything buyers read on the public store page that the store
// writes itself. Checked the way the database checks it. The inspection record, rating, reviews and
// figures are Dogeash's, so they aren't here (the database keeps them whatever is sent).

const optional = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`).default('')
const thisYear = new Date().getFullYear()
const year = z.coerce.number({ message: 'A year, like 2014' }).int('A year, like 2014').min(1900, 'A year, like 2014').max(thisYear, 'That year hasn\'t happened yet')

export const storeFormSchema = z.object({
  name: z.string().trim().min(2, 'Give the store\'s name').max(80, 'Keep the name under 80 characters'),
  tagline: z.string().trim().min(10, 'Say in a line what you\'re known for (10 characters or more)').max(140, 'Keep the tagline under 140 characters'),
  city: z.string().trim().min(2, 'Which city is the kennel in?').max(60),
  area: optional(60),
  state: optional(60),
  founded: year,
  about: z.string().trim().min(40, 'Write a few sentences about the kennel (40 characters or more)').max(1200, 'Keep it under 1,200 characters'),
  hours: optional(120),
  deliveryAreas: optional(200),
  services: z.array(z.enum(Object.keys(storeServices) as [StoreService, ...StoreService[]])),
  ownerName: z.string().trim().min(2, 'Who runs the kennel?').max(80),
  ownerTitle: optional(80),
  ownerYears: z.coerce.number({ message: 'Years, like 12' }).int('Whole years').min(0, 'Years, like 12').max(70, 'Years, like 12'),
  ownerBio: optional(600),
  credentials: z.array(z.string().trim().min(1).max(80)).max(6, 'Up to 6 credentials'),
  history: z.array(z.object({ year, text: z.string().trim().min(3, 'Say what happened').max(160, 'Keep it under 160 characters') })).max(12, 'Up to 12 moments'),
})
export type StoreFormValues = z.infer<typeof storeFormSchema>

export const storeFormFromStore = (s: Store): StoreFormValues => ({
  name: s.name,
  tagline: s.tagline,
  city: s.city,
  area: s.area,
  state: s.state,
  founded: s.founded,
  about: s.about,
  hours: s.hours,
  deliveryAreas: s.deliveryAreas,
  services: s.services,
  ownerName: s.owner.name,
  ownerTitle: s.owner.title,
  ownerYears: s.owner.yearsWithDogs,
  ownerBio: s.owner.bio,
  credentials: s.owner.credentials,
  history: s.history.map(h => ({ ...h })),
})

type StoreWrite = Database['public']['Tables']['stores']['Update']

// Form values → the stores table's columns (the care team has its own table, store_care_links)
export const storeFormToRow = (v: StoreFormValues): StoreWrite => ({
  name: v.name,
  initials: initialsOf(v.name),
  tagline: v.tagline,
  city: v.city,
  area: v.area,
  state: v.state,
  founded: v.founded,
  details: {
    about: v.about,
    hours: v.hours,
    deliveryAreas: v.deliveryAreas,
    services: v.services,
    owner: { name: v.ownerName, title: v.ownerTitle, yearsWithDogs: v.ownerYears, bio: v.ownerBio, credentials: v.credentials },
    history: [...v.history].sort((a, b) => a.year - b.year),
  },
})

// Text fields, in the groups the form shows them
const input = (name: keyof StoreFormValues, label: string, placeholder: string, extra: Partial<FieldConfig> = {}): FieldConfig =>
  ({ fieldType: 'input', name, label, attrs: { placeholder, ...extra.attrs }, ...extra } as FieldConfig)

export const storeFormFields = {
  store: [
    input('name', 'Store name', 'K9 Guardian Kennels', { attrs: { maxlength: 80 } }),
    input('tagline', 'Tagline', 'Titled working-line Malinois and Shepherds for executive homes', { attrs: { maxlength: 140 }, hint: 'One line under your name on your store page and in search.' }),
  ],
  place: [
    input('city', 'City', 'Abuja'),
    input('area', 'Area', 'Kuje'),
    input('state', 'State', 'FCT'),
    input('founded', 'Founded', '2014', { attrs: { inputmode: 'numeric', maxlength: 4 } }),
  ],
  visiting: [
    input('hours', 'Opening hours', 'Mon–Sat, 8am–5pm. Visits by appointment.'),
    input('deliveryAreas', 'Where you deliver', 'Abuja, Kaduna, Lagos, Port Harcourt', { hint: 'Cities or states, separated by commas.' }),
  ],
  owner: [
    input('ownerName', 'Name', 'Col. (rtd) Ibrahim Danjuma'),
    input('ownerTitle', 'Role', 'Founder and head trainer'),
    input('ownerYears', 'Years working with dogs', '26', { attrs: { inputmode: 'numeric', maxlength: 2 } }),
  ],
}

// ── Setting up the profile in steps ─────────────────────────────────────────
// The profile in six steps. Each step is checked against its own fields only and saved when you leave it.
// History and the banner and logo are optional; the last step reviews everything.
export type StoreStepKey = 'store' | 'about' | 'owner' | 'history' | 'images' | 'review'
type FormField = keyof StoreFormValues

export const storeSteps: { key: StoreStepKey, title: string, hint: string, why: string, fields: FormField[], optional?: boolean }[] = [
  { key: 'store', title: 'Your store', hint: 'Name, tagline and where you are', why: 'Buyers search by city, and your tagline shows under your name in every list.', fields: ['name', 'tagline', 'city', 'area', 'state', 'founded'] },
  { key: 'about', title: 'About the kennel', hint: 'Your story, services and hours', why: 'Buyers read this before they book a visit. Say what makes your dogs and your handover different.', fields: ['about', 'services', 'hours', 'deliveryAreas'] },
  { key: 'owner', title: 'Who runs it', hint: 'The person behind the kennel', why: 'A guard dog is a serious purchase. Buyers want to know who trained it and who they will deal with.', fields: ['ownerName', 'ownerTitle', 'ownerYears', 'ownerBio', 'credentials'] },
  { key: 'history', title: 'History', hint: 'Moments worth knowing', why: 'A timeline shows buyers how long you have done this. You can skip it and add it later.', fields: ['history'], optional: true },
  { key: 'images', title: 'Banner and logo', hint: 'How your store looks', why: 'Stores with a banner and logo look established. Until you add them, your initials show.', fields: [], optional: true },
  { key: 'review', title: 'Review', hint: 'Check and finish', why: 'Everything in one place before you finish. Every step is already saved.', fields: [] },
]

// The rules for one step: the same as the full form, for that step's fields only
export const storeStepSchema = (key: StoreStepKey) => {
  const fields = storeSteps.find(s => s.key === key)!.fields
  return fields.length ? storeFormSchema.pick(Object.fromEntries(fields.map(f => [f, true])) as Partial<Record<FormField, true>>) : z.object({})
}

// Whether a step has what it needs, from the saved store
export function storeStepDone(s: Store, key: StoreStepKey): boolean {
  switch (key) {
    case 'store': return s.name.length >= 2 && s.tagline.length >= 10 && !!s.city
    case 'about': return s.about.length >= 40
    case 'owner': return s.owner.name.length >= 2
    case 'history': return s.history.length > 0
    case 'images': return !!s.banner || !!s.logo
    case 'review': return false
  }
}

// Setting up (go step by step) until the three essential steps are done; after that, editing (any step, any order)
export const storeSetupNeeded = (s: Store) => !(['store', 'about', 'owner'] as const).every(k => storeStepDone(s, k))
