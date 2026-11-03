import type { Dog } from './dogs'
import type { PropertyType, ProtectionLevel } from './protection'
import { propertyTypes } from './protection'

// The filters on Find a guard dog, in one shape: read from and written to the page address
// (?level=3,4&city=Abuja), matched against dogs, described in words, and stored as a saved search.
export interface SearchFilters {
  property: PropertyType[]
  level: ProtectionLevel[]
  city: string[]
  breed: string[]
  children: boolean
}

export const emptyFilters = (): SearchFilters => ({ property: [], level: [], city: [], breed: [], children: false })

const list = (value: unknown) => (Array.isArray(value) ? value.join(',') : String(value ?? '')).split(',').map(v => v.trim()).filter(Boolean)

export function filtersFromQuery(query: Record<string, unknown>): SearchFilters {
  const properties = propertyTypes.map(p => p.value) as string[]
  return {
    property: list(query.property).filter(p => properties.includes(p)) as PropertyType[],
    level: list(query.level).map(Number).filter(n => n >= 1 && n <= 5) as ProtectionLevel[],
    city: list(query.city),
    breed: list(query.breed),
    children: query.children === '1',
  }
}

export function filtersToQuery(f: SearchFilters): Record<string, string> {
  const q: Record<string, string> = {}
  if (f.property.length) q.property = f.property.join(',')
  if (f.level.length) q.level = [...f.level].sort().join(',')
  if (f.city.length) q.city = f.city.join(',')
  if (f.breed.length) q.breed = f.breed.join(',')
  if (f.children) q.children = '1'
  return q
}

export const hasFilters = (f: SearchFilters) => Object.keys(filtersToQuery(f)).length > 0

export const matchesFilters = (f: SearchFilters, dog: Dog) =>
  (!f.property.length || f.property.some(p => dog.property.includes(p)))
  && (!f.level.length || f.level.includes(dog.level))
  && (!f.city.length || f.city.includes(dog.city))
  && (!f.children || dog.safeWithChildren)
  && (!f.breed.length || f.breed.includes(dog.breed))

// "Level 3–4 · Abuja · Compound · Safe with children"
export function describeFilters(f: SearchFilters) {
  const levels = [...f.level].sort()
  const parts = [
    levels.length ? (levels.length === 1 ? `Level ${levels[0]}` : levels.every((l, i) => i === 0 || l === levels[i - 1]! + 1) ? `Level ${levels[0]}–${levels.at(-1)}` : `Levels ${levels.join(', ')}`) : '',
    f.city.join(', '),
    f.property.map(p => propertyTypes.find(t => t.value === p)?.label ?? p).join(', '),
    f.breed.join(', '),
    f.children ? 'Safe with children' : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'All guard dogs'
}

export const sameFilters = (a: SearchFilters, b: SearchFilters) => JSON.stringify(filtersToQuery(a)) === JSON.stringify(filtersToQuery(b))
