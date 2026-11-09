import type { StoreStatus } from './admin'

// Kennel inspections (Supabase: inspections, through the admin_… inspection functions). The checklist an
// inspector works through, what each status means, and the shapes the functions send back.
export type InspectionStatus = 'scheduled' | 'passed' | 'failed' | 'cancelled'

export const inspectionStatusMeta: Record<InspectionStatus, { label: string, color: string }> = {
  scheduled: { label: 'Booked', color: 'var(--cat-2)' },
  passed: { label: 'Passed', color: 'var(--cat-1)' },
  failed: { label: 'Failed', color: 'var(--cat-5)' },
  cancelled: { label: 'Cancelled', color: 'var(--line-strong)' },
}

// The standard checks, in the order an inspector walks the kennel
export const standardChecks: { key: string, label: string, hint: string }[] = [
  { key: 'runs', label: 'Clean, shaded kennel runs', hint: 'Dry floors, shade at midday, room to move' },
  { key: 'water', label: 'Clean water for every dog', hint: 'Fresh, within reach, shaded' },
  { key: 'vet', label: 'Vet records for every dog', hint: 'Vaccinations up to date, signed by a vet' },
  { key: 'chips', label: 'Microchips scanned and matched', hint: 'Every chip reads and matches the dog\'s record' },
  { key: 'levels', label: 'Protection levels tested on site', hint: 'Each dog shown working at its listed level' },
  { key: 'listings', label: 'Dogs match their listings', hint: 'Photos, age, sex and breed are right' },
  { key: 'owner', label: 'Owner\'s ID matches', hint: 'The person on the ID runs the kennel' },
  { key: 'registration', label: 'Business registration seen', hint: 'CAC certificate, or noted as not registered' },
]

export interface InspectionCheck { key: string, label: string, ok: boolean | null, note: string }
export interface InspectionDog { id: string, file_no: string, name: string, breed: string, listed_level: number, seen: boolean, confirmed_level: number, note: string }

// A row in the Inspections list (admin_inspections())
export interface InspectionListItem {
  id: string
  status: InspectionStatus
  scheduled_for: string
  completed_at: string | null
  note: string
  summary: string
  store_id: string
  store_name: string
  store_city: string
  store_status: StoreStatus
  inspector: string | null
  dogs: number
  checked: number
}

// One inspection with all it needs (admin_inspection())
export interface InspectionSheet {
  id: string
  status: InspectionStatus
  scheduled_for: string
  completed_at: string | null
  note: string
  checklist: InspectionCheck[]
  dogs: InspectionDog[]
  photos: string[]
  summary: string
  store_public_id: string
  store_name: string
  store_city: string
  store_status: StoreStatus
  address: string | null
  directions: string | null
  contact_phone: string | null
  inspector: string | null
  dog_photos: Record<string, string | null>
}

// A fresh checklist for a sheet that hasn't been started; a saved one keeps its answers
export const checklistFor = (saved: InspectionCheck[]) =>
  standardChecks.map(c => saved.find(s => s.key === c.key) ?? { key: c.key, label: c.label, ok: null, note: '' })

// Visit times to offer when booking
export const inspectionTimes = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']

// "Tue 10 Nov, 10:00" in Lagos time
export const inspectionWhen = (iso: string) => new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' })
