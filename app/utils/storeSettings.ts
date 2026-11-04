import { z } from 'zod'
import type { VisitSettings } from './stores'

// The store settings form: when the store takes kennel visits, and pausing them.
// Checked the way the database checks it (at least one day and time, up to 12 times, a short note).

// Half-hours from 7:00 to 18:00, the times a store can offer
export const visitSlotOptions = Array.from({ length: 23 }, (_, i) => `${7 + Math.floor(i / 2)}:${i % 2 ? '30' : '00'}`)
export const weekdayOptions = [1, 2, 3, 4, 5, 6, 0].map(d => ({ value: d, label: new Date(2026, 10, 1 + d).toLocaleDateString('en-NG', { weekday: 'short' }) }))

export const visitSettingsSchema = z.object({
  days: z.array(z.number().int().min(0).max(6)).min(1, 'Choose at least one day'),
  slots: z.array(z.string()).min(1, 'Choose at least one time').max(12, 'Up to 12 times'),
  home: z.boolean(),
  paused: z.boolean(),
  note: z.string().trim().max(200, 'Keep the note under 200 characters'),
})

// Times sorted by the clock, not alphabetically ("9:00" before "10:30")
const minutes = (t: string) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1])
export const sortSlots = (slots: string[]) => [...slots].sort((a, b) => minutes(a) - minutes(b))

export const visitSettingsToRow = (v: VisitSettings) => ({
  visit_days: [...v.days].sort(),
  visit_slots: sortSlots(v.slots),
  home_visits: v.home,
  visits_paused: v.paused,
  pause_note: v.paused ? v.note.trim() : '',
})
