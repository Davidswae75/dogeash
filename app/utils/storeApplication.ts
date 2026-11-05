import { z } from 'zod'
import type { FieldConfig } from '~/components/Fields.vue'
import type { Database } from '~/types/database.types'

// A store's application to go live: where the kennel is, how the inspector gets in touch, which days suit,
// and the documents. Checked the way the database checks it before the application can be sent.
export type ApplicationRow = Database['public']['Tables']['store_applications']['Row']
export type DocKind = 'id' | 'cac' | 'address'

export const applicationSchema = z.object({
  address: z.string().trim().min(10, 'The kennel\'s full address, so the inspector can find it').max(300),
  directions: z.string().trim().max(500).default(''),
  contactPhone: z.string().trim().min(7, 'A phone number the inspector can call').max(40),
  preferredDays: z.array(z.string()).min(1, 'Choose at least one day').max(3, 'Up to 3 days'),
  cacRegistered: z.boolean(),
  note: z.string().trim().max(1000).default(''),
})
export type ApplicationValues = z.infer<typeof applicationSchema>

export const applicationFromRow = (r: ApplicationRow | null, phone = ''): ApplicationValues => ({
  address: r?.address ?? '',
  directions: r?.directions ?? '',
  contactPhone: r?.contact_phone || phone,
  preferredDays: r?.preferred_days ?? [],
  cacRegistered: r?.cac_registered ?? true,
  note: r?.note ?? '',
})

export const applicationToRow = (v: ApplicationValues) => ({
  address: v.address,
  directions: v.directions,
  contact_phone: v.contactPhone,
  preferred_days: [...v.preferredDays].sort(),
  cac_registered: v.cacRegistered,
  note: v.note,
})

// The documents, and which column each one lives in
export const docKinds: { key: DocKind, column: 'id_doc_path' | 'cac_doc_path' | 'address_doc_path', label: string, hint: string }[] = [
  { key: 'id', column: 'id_doc_path', label: 'Owner\'s ID', hint: 'NIN slip, international passport or driver\'s licence. Required.' },
  { key: 'cac', column: 'cac_doc_path', label: 'CAC certificate', hint: 'Your business registration. Required unless the kennel isn\'t registered yet.' },
  { key: 'address', column: 'address_doc_path', label: 'Proof of kennel address', hint: 'A utility bill or tenancy agreement. Optional, but it speeds up the review.' },
]
export const DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
export const DOC_MAX_MB = 10

// Inspection days to choose from: Monday to Saturday, from three days out, for the next three weeks
export function inspectionDayOptions(from = new Date()) {
  const out: { value: string, label: string }[] = []
  const d = new Date(from)
  d.setDate(d.getDate() + 2)
  while (out.length < 15) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0) continue
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({ value, label: d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }) })
  }
  return out
}

// Text fields of the address part
const input = (name: keyof ApplicationValues, label: string, placeholder: string, extra: Partial<FieldConfig> = {}): FieldConfig =>
  ({ fieldType: 'input', name, label, attrs: { placeholder, ...extra.attrs }, ...extra } as FieldConfig)
export const applicationFields = [
  input('address', 'Kennel address', '14 Admiralty Way, Lekki Phase 1, Lagos', { hint: 'Where the dogs are kept. Only Dogeash sees it.' }),
  input('directions', 'Directions', 'Second gate after the filling station; blue roof', { hint: 'Optional. Landmarks that help the inspector.' }),
  input('contactPhone', 'Phone for the inspector', '0803 000 0000', { attrs: { inputmode: 'tel', autocomplete: 'tel' } }),
]
