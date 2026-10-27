import type { Dog } from './dogs'

// How many shortlisted dogs can be compared side by side
export const COMPARE_MAX = 3

// Rows on the compare page: what to show for each dog, and which value is "best" where that's clear-cut
export interface CompareRow {
  label: string
  value: (dog: Dog) => string
  /** Numeric key for picking the best dog on this row; lower wins unless `higherIsBetter` */
  rank?: (dog: Dog) => number
  higherIsBetter?: boolean
}

export const compareRows: CompareRow[] = [
  { label: 'Price', value: d => formatNaira(d.priceNaira), rank: d => d.priceNaira },
  { label: 'Breed', value: d => d.breed },
  { label: 'Sex and age', value: d => `${d.sex}, ${d.age}` },
  { label: 'Weight', value: d => `${d.weightKg} kg` },
  { label: 'Hips', value: d => d.file?.hipsElbows ?? d.hips },
  { label: 'Safe with children', value: d => d.safeWithChildren ? 'Yes, tested' : 'Not recommended' },
  { label: 'Suits', value: d => d.property.map(p => propertyTypes.find(t => t.value === p)?.label).join(', ') },
  { label: 'Titles', value: d => d.file?.titles ?? '—' },
  { label: 'Store', value: d => getStore(d.storeId)?.name ?? '—' },
  { label: 'City', value: d => d.city },
  { label: 'Status', value: d => d.status === 'available' ? 'Available' : 'Reserved by another buyer' },
]

export function bestOn(row: CompareRow, dogs: Dog[]) {
  if (!row.rank || dogs.length < 2) return undefined
  const ranks = dogs.map(row.rank)
  const best = row.higherIsBetter ? Math.max(...ranks) : Math.min(...ranks)
  return ranks.filter(r => r === best).length === 1 ? dogs[ranks.indexOf(best)]!.fileNo : undefined
}
