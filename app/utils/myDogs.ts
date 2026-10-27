import type { ProtectionLevel } from './protection'

// Dogs a buyer owns after handover: a living record of health, training and care.
// One sample dog for the signed-in buyer until accounts and the API exist.

export type CareStatus = 'up-to-date' | 'due-soon' | 'overdue'

export interface OwnedDog {
  fileNo: string
  name: string
  breed: string
  sex: 'Male' | 'Female'
  born: string
  age: string
  weightKg: number
  level: ProtectionLevel
  microchip: string
  storeId: string
  handedOver: string
  photo?: string
  guarantee: { until: string, covers: string, monthsLeft: number, months: number }
  vaccinations: { name: string, given: string, due: string, status: CareStatus }[]
  training: { title: string, date: string, by: string, note: string }[]
  reminders: { title: string, due: string, status: CareStatus }[]
}

export const careStatus: Record<CareStatus, { label: string, tone: string, dot: string }> = {
  'up-to-date': { label: 'Up to date', tone: 'bg-ash-soft text-ink', dot: 'bg-ash' },
  'due-soon': { label: 'Due soon', tone: 'bg-marigold-soft text-ink', dot: 'bg-marigold' },
  'overdue': { label: 'Overdue', tone: 'bg-danger/12 text-danger', dot: 'bg-danger' },
}

export const sampleOwnedDogs: OwnedDog[] = [
  {
    fileNo: 'KD-2025-118',
    name: 'Bruno',
    breed: 'Boerboel',
    sex: 'Male',
    born: 'Mar 2023',
    age: '3 years',
    weightKg: 61,
    level: 4,
    microchip: '985 112 004 771 309',
    storeId: 'STR-001',
    handedOver: '12 Aug 2026',
    guarantee: { until: '12 Aug 2027', covers: 'Hips, elbows and inherited conditions', monthsLeft: 10, months: 12 },
    vaccinations: [
      { name: 'Rabies', given: '14 Aug 2026', due: 'Aug 2027', status: 'up-to-date' },
      { name: 'DHPPi (5-in-1)', given: '14 Aug 2026', due: 'Aug 2027', status: 'up-to-date' },
      { name: 'Deworming', given: '1 Aug 2026', due: '1 Nov 2026', status: 'due-soon' },
      { name: 'Tick and flea', given: '1 Sep 2026', due: '1 Oct 2026', status: 'overdue' },
    ],
    training: [
      { title: 'Refresher: gate control', date: '20 Sep 2026', by: 'Steelpaw Training', note: 'Holds at the gate until released; ignores food from strangers.' },
      { title: 'Handover training, day 2', date: '13 Aug 2026', by: 'K9 Guardian Kennels', note: 'House staff and driver learned the commands.' },
      { title: 'Handover training, day 1', date: '12 Aug 2026', by: 'K9 Guardian Kennels', note: 'Settled into the compound; night patrol route walked.' },
    ],
    reminders: [
      { title: 'Tick and flea treatment', due: '1 Oct 2026', status: 'overdue' },
      { title: 'Deworming', due: '1 Nov 2026', status: 'due-soon' },
      { title: 'Training refresher', due: 'Dec 2026', status: 'up-to-date' },
    ],
  },
]

export const findOwnedDog = (fileNo: string) =>
  sampleOwnedDogs.find(d => d.fileNo.toLowerCase() === fileNo.toLowerCase())

// Reminders, most urgent first: overdue, then due soon
const urgency: CareStatus[] = ['overdue', 'due-soon', 'up-to-date']
export const sortedReminders = (dog: OwnedDog) =>
  [...dog.reminders].sort((a, b) => urgency.indexOf(a.status) - urgency.indexOf(b.status))
export const nextReminder = (dog: OwnedDog) => sortedReminders(dog)[0]

export const ownedDogLink = (dog: OwnedDog) => `/account/dogs/${dog.fileNo.toLowerCase()}`
