import { z } from 'zod'
import gearBed from '@/assets/gears/gear-bed.jpg'
import gearBowls from '@/assets/gears/gear-bowls.jpg'
import gearCollar from '@/assets/gears/gear-collar.jpg'
import gearFleaTreatment from '@/assets/gears/gear-flea-treatment.jpg'
import gearFood from '@/assets/gears/gear-food.jpg'
import gearHarnessNight from '@/assets/gears/gear-harness-night.jpg'
import gearHarnessPatrol from '@/assets/gears/gear-harness-patrol.jpg'
import gearKennelRun from '@/assets/gears/gear-kennel-run.jpg'
import gearLead from '@/assets/gears/gear-lead.jpg'
import type { FieldConfig } from '~/components/Fields.vue'
import { phoneSignInSchema, signUpSchema } from './auth'
import { authFields } from './authFields'

// Gear shop: normal products with sizes and quantities. Dogs never go in the cart.

export type GearCategory = 'harness' | 'collar' | 'kennel' | 'bowl' | 'food' | 'health'

export const gearCategories: Record<GearCategory, string> = {
  harness: 'Harnesses',
  collar: 'Collars and leads',
  kennel: 'Kennel runs',
  bowl: 'Bowls',
  food: 'Food',
  health: 'Health',
}

export interface GearProduct {
  id: string
  name: string
  category: GearCategory
  description: string
  priceNaira: number
  supplierId: string
  // Product photo. Without one, the category placeholder shows instead
  image?: string
  // Options like S / M / L, with who each one fits
  sizes?: { value: string, fits: string }[]
}

const harnessSizes = [
  { value: 'M', fits: '20–30 kg' },
  { value: 'L', fits: '30–45 kg' },
  { value: 'XL', fits: '45–65 kg' },
]

// Example products and prices until suppliers can list their own
export const sampleGear: GearProduct[] = [
  { id: 'GR-101', name: 'Patrol harness', category: 'harness', description: 'Padded chest plate and a top handle for control at the gate.', priceNaira: 38_000, supplierId: 'CARE-06', image: gearHarnessPatrol, sizes: harnessSizes },
  { id: 'GR-102', name: 'Reflective night harness', category: 'harness', description: 'Reflective strips so the dog stays visible on night patrol.', priceNaira: 46_000, supplierId: 'CARE-06', image: gearHarnessNight, sizes: harnessSizes },
  { id: 'GR-201', name: 'Wide leather collar', category: 'collar', description: 'Stitched leather with a steel buckle and room for an ID tag.', priceNaira: 15_000, supplierId: 'CARE-06', image: gearCollar, sizes: harnessSizes },
  { id: 'GR-202', name: 'Handler lead, 1.5 m', category: 'collar', description: 'Short lead for close control around visitors.', priceNaira: 9_500, supplierId: 'CARE-06', image: gearLead },
  { id: 'GR-301', name: 'Covered kennel run, 2 × 3 m', category: 'kennel', description: 'Galvanised mesh, a shade roof and a lockable gate. Delivered flat-packed.', priceNaira: 420_000, supplierId: 'CARE-03', image: gearKennelRun },
  { id: 'GR-302', name: 'Raised kennel bed', category: 'kennel', description: 'Keeps the dog off hot or wet floors. Washes down with a hose.', priceNaira: 32_000, supplierId: 'CARE-03', image: gearBed },
  { id: 'GR-401', name: 'No-tip steel bowl set', category: 'bowl', description: 'Two heavy bowls for food and water, in a stand that stays put.', priceNaira: 12_000, supplierId: 'CARE-06', image: gearBowls },
  { id: 'GR-501', name: 'Working dog starter food, 15 kg', category: 'food', description: 'High-protein dry food for large, active breeds.', priceNaira: 58_000, supplierId: 'CARE-06', image: gearFood },
  { id: 'GR-601', name: 'Tick and flea treatment, 3 months', category: 'health', description: 'Monthly spot-on treatment. Ask your vet about the right dose.', priceNaira: 18_500, supplierId: 'CARE-06', image: gearFleaTreatment, sizes: harnessSizes },
]

export const findGear = (id: string) => sampleGear.find(p => p.id === id)

// Example delivery rule
export const GEAR_FREE_DELIVERY_FROM = 100_000
export const GEAR_DELIVERY_FEE = 5_000
export const GEAR_MAX_QUANTITY = 10

export const gearCheckoutSchema = z.object({
  fullName: signUpSchema.shape.fullName,
  phone: phoneSignInSchema.shape.phone,
  address: z.string({ required_error: 'Enter the delivery address.' }).trim().min(5, 'Enter the delivery address.'),
  city: z.string({ required_error: 'Enter the city.' }).trim().min(2, 'Enter the city.'),
})

export const gearCheckoutFields = (): FieldConfig[] => [
  authFields.fullName(),
  authFields.phone('The delivery rider calls this number.'),
  {
    fieldType: 'input',
    label: 'Delivery address',
    name: 'address',
    attrs: { autocomplete: 'street-address', placeholder: '12 Gana Street, Maitama' },
  },
  authFields.city(),
]
