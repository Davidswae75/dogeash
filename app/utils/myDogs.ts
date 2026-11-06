import type { ProtectionLevel } from './protection'

// Dogs a person owns (bought on Dogeash or elsewhere) and each one's record: vaccinations, treatments,
// vet visits, training and reminders (Supabase: owned_dogs, owned_dog_records; useOwnedDogs()).
// Whether something is on time is worked out from its due date, so it's always current.

export type CareStatus = 'up-to-date' | 'due-soon' | 'overdue'
export type RecordKind = 'vaccination' | 'treatment' | 'vet' | 'training' | 'reminder'

export interface OwnedDogRecord {
  id: string
  kind: RecordKind
  title: string
  /** When it was given or happened (yyyy-mm-dd) */
  doneOn: string | null
  /** When it's next due (yyyy-mm-dd) */
  dueOn: string | null
  byWhom: string
  note: string
}

export interface OwnedDog {
  id: string
  name: string
  breed: string
  sex: 'Male' | 'Female' | null
  bornOn: string | null
  weightKg: number | null
  microchip: string
  level: ProtectionLevel | null
  photoPath: string | null
  /** A short-lived link to the photo (the bucket is private) */
  photo?: string
  cameFrom: string
  gotOn: string | null
  notes: string
  records: OwnedDogRecord[]
}

export const careStatus: Record<CareStatus, { label: string, tone: string, dot: string }> = {
  'up-to-date': { label: 'Up to date', tone: 'bg-ash-soft text-ink', dot: 'bg-ash' },
  'due-soon': { label: 'Due soon', tone: 'bg-marigold-soft text-ink', dot: 'bg-marigold' },
  'overdue': { label: 'Overdue', tone: 'bg-danger/12 text-danger', dot: 'bg-danger' },
}

export const recordKinds: Record<RecordKind, { label: string, hint: string, example: string }> = {
  vaccination: { label: 'Vaccination', hint: 'Rabies, 5-in-1 and boosters', example: 'Rabies' },
  treatment: { label: 'Treatment', hint: 'Deworming, tick and flea, medicine', example: 'Deworming' },
  vet: { label: 'Vet visit', hint: 'Check-ups, injuries, tests', example: 'Annual check-up' },
  training: { label: 'Training', hint: 'Sessions, refreshers, commands learned', example: 'Gate control refresher' },
  reminder: { label: 'Reminder', hint: 'Anything to remember on a date', example: 'Buy food' },
}

// "Due soon" means within 30 days
const SOON_DAYS = 30
const today = () => new Date(new Date().toDateString())
const asDate = (iso: string) => new Date(`${iso}T00:00:00`)

export function statusOf(dueOn: string | null): CareStatus {
  if (!dueOn) return 'up-to-date'
  const days = (asDate(dueOn).getTime() - today().getTime()) / 864e5
  return days < 0 ? 'overdue' : days <= SOON_DAYS ? 'due-soon' : 'up-to-date'
}

/** "14 Aug 2026" */
export const dayLabel = (iso: string | null) => (iso ? asDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

/** "3 years", "7 months", from the birth date */
export function ageOf(bornOn: string | null) {
  if (!bornOn) return ''
  const months = Math.max(0, Math.floor((today().getTime() - asDate(bornOn).getTime()) / (864e5 * 30.44)))
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'year' : 'years'}`
}

/** The facts line under a name: "Boerboel · Male · 3 years" */
export const dogSummary = (d: OwnedDog) => [d.breed, d.sex, ageOf(d.bornOn)].filter(Boolean).join(' · ')

// Health: vaccinations, treatments and vet visits, newest first
export const healthOf = (d: OwnedDog) =>
  d.records.filter(r => r.kind !== 'training' && r.kind !== 'reminder').sort((a, b) => (b.doneOn ?? b.dueOn ?? '').localeCompare(a.doneOn ?? a.dueOn ?? ''))
// Training sessions, newest first
export const trainingOf = (d: OwnedDog) =>
  d.records.filter(r => r.kind === 'training').sort((a, b) => (b.doneOn ?? b.dueOn ?? '').localeCompare(a.doneOn ?? a.dueOn ?? ''))
// Everything with a due date still to come or missed, most urgent first
export const upcomingOf = (d: OwnedDog) =>
  d.records.filter(r => r.dueOn).sort((a, b) => a.dueOn!.localeCompare(b.dueOn!))
export const nextDue = (d: OwnedDog) => upcomingOf(d)[0]
export const needsAttention = (d: OwnedDog) => upcomingOf(d).filter(r => statusOf(r.dueOn) !== 'up-to-date').length

export const ownedDogLink = (d: Pick<OwnedDog, 'id'>) => `/account/dogs/${d.id}`
