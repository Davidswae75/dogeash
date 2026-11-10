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

export const findGear = (id: string) => sampleGear.find(p => p.id.toLowerCase() === id.toLowerCase())
export const gearPath = (p: GearProduct) => `/gear/${p.id.toLowerCase()}`

// Everything else a buyer reads on a product's own page: what makes it good, the specifications, and what
// comes in the box. Example details until suppliers can list their own.
export interface GearInfo { features: string[], specs: { label: string, value: string }[], inBox: string[], care?: string }
export const gearInfo: Record<string, GearInfo> = {
  'GR-101': { features: ['Padded, shaped chest plate spreads the pull', 'Grab handle on top for control at the gate', 'Quick-release buckles, two adjustment points', 'D-ring at the back for a lead'], specs: [{ label: 'Material', value: 'Nylon webbing, neoprene padding' }, { label: 'Hardware', value: 'Steel D-ring, ITW buckles' }, { label: 'Colour', value: 'Black' }], inBox: ['Harness', 'Sizing card'], care: 'Hand wash, dry in the shade.' },
  'GR-102': { features: ['Reflective strips on both sides', 'Light padding for long night shifts', 'Top handle and back D-ring'], specs: [{ label: 'Material', value: 'Nylon with 3M reflective tape' }, { label: 'Colour', value: 'Black and silver' }], inBox: ['Harness'], care: "Hand wash; don't iron the reflective tape." },
  'GR-201': { features: ['Thick stitched leather that softens with wear', 'Solid steel buckle and D-ring', 'Room for an ID tag'], specs: [{ label: 'Material', value: 'Full-grain leather' }, { label: 'Width', value: '5 cm' }], inBox: ['Collar'], care: 'Wipe clean; oil now and then.' },
  'GR-202': { features: ['Short length for close control', 'Padded handle', 'Swivel steel clip'], specs: [{ label: 'Length', value: '1.5 m' }, { label: 'Material', value: 'Braided nylon' }], inBox: ['Lead'] },
  'GR-301': { features: ["Galvanised welded mesh that won't rust", 'Shade roof against sun and rain', 'Lockable gate', 'Bolts together, no welding'], specs: [{ label: 'Size', value: '2 × 3 m, 1.8 m high' }, { label: 'Frame', value: 'Galvanised steel' }, { label: 'Roof', value: 'Corrugated sheet' }, { label: 'Weight', value: 'About 140 kg' }], inBox: ['Mesh panels and gate', 'Roof sheets', 'Bolts and fixings', 'Assembly guide'], care: 'Installation by the supplier can be arranged; ask after ordering.' },
  'GR-302': { features: ['Raised off hot or wet floors', 'Breathable mesh bed', 'Hose down to clean'], specs: [{ label: 'Size', value: '110 × 80 cm' }, { label: 'Frame', value: 'Powder-coated steel' }, { label: 'Takes', value: 'Up to 70 kg' }], inBox: ['Frame', 'Mesh bed', 'Fittings'] },
  'GR-401': { features: ['Heavy stainless steel bowls', "Stand that doesn't tip or slide", 'Bowls lift out to wash'], specs: [{ label: 'Bowls', value: '2 × 2.8 litres' }, { label: 'Material', value: 'Stainless steel' }], inBox: ['Stand', 'Two bowls'] },
  'GR-501': { features: ['High protein for large, active breeds', 'Added joint support', 'Resealable bag'], specs: [{ label: 'Weight', value: '15 kg' }, { label: 'Protein', value: '28%' }, { label: 'For', value: 'Adult dogs over 25 kg' }], inBox: ['One 15 kg bag'], care: 'Store in a cool, dry place. Change food over 7 days.' },
  'GR-601': { features: ['Kills ticks and fleas for a month', 'Three monthly doses', "Dose by the dog's weight"], specs: [{ label: 'Doses', value: '3 pipettes' }, { label: 'Use', value: 'On the skin, between the shoulders' }], inBox: ['3 pipettes', 'Leaflet'], care: 'Ask your vet about the right dose; keep away from children.' },
}
export const infoFor = (p: GearProduct): GearInfo => gearInfo[p.id] ?? { features: [], specs: [], inBox: [] }

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
