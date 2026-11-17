import type { Dog } from './dogs'
import type { PropertyType, ProtectionLevel } from './protection'
import { propertyTypes, protectionLevels } from './protection'

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

// What someone typed in a search box ("Malinois", "level 4 Abuja", "family protection for a compound"),
// turned into the same filters: breeds and cities the catalogue has, levels by number or name, property kinds,
// and "children". Words that match none of those come back as `rest`, a plain text search.
const STOP = new Set(['a', 'an', 'the', 'in', 'at', 'for', 'of', 'and', 'with', 'near', 'my', 'dog', 'dogs', 'guard', 'level', 'levels', 'lvl', 'protection', 'trained', 'to', 'around', 'safe'])
const PROPERTY_WORDS: Record<string, PropertyType> = { home: 'home', house: 'home', compound: 'compound', estate: 'estate', business: 'business', office: 'business', shop: 'business', warehouse: 'business' }
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function parseSearch(text: string, known: { breeds: string[], cities: string[] }): { filters: SearchFilters, rest: string } {
  const f = emptyFilters()
  let t = ` ${text.toLowerCase().replace(/[,;/]+/g, ' ').replace(/\s+/g, ' ').trim()} `
  const take = (phrase: string) => {
    const re = new RegExp(`\\s${escape(phrase.toLowerCase())}\\s`)
    if (!re.test(t)) return false
    t = t.replace(re, ' ')
    return true
  }

  // Level names first ("estate and executive", "family protection" hold words used below)
  for (const [n, l] of Object.entries(protectionLevels)) if (take(l.name)) f.level.push(Number(n) as ProtectionLevel)
  // "level 4", "levels 3 4", "l4", or a lone 1–5
  t = t.replace(/\s(?:levels?|lvl|l)\s?([1-5])(?:\s(?:and|to|-|–)?\s?([1-5]))?(?=\s)/g, (_, a: string, b?: string) => {
    const lo = Number(a)
    const hi = Number(b ?? a)
    for (let n = Math.min(lo, hi); n <= Math.max(lo, hi); n++) f.level.push(n as ProtectionLevel)
    return ' '
  })
  t = t.replace(/\s([1-5])(?=\s)/g, (_, a: string) => { f.level.push(Number(a) as ProtectionLevel); return ' ' })

  // Breeds: the full name, else a distinctive word of it ("malinois", "shepherd", "rottweiler")
  for (const breed of [...known.breeds].sort((a, b) => b.length - a.length)) {
    if (take(breed)) { f.breed.push(breed); continue }
    const word = breed.toLowerCase().split(' ').filter(w => w.length >= 5 && !['german', 'belgian', 'giant', 'dutch'].includes(w)).find(w => take(w))
    if (word) f.breed.push(breed)
  }
  for (const city of [...known.cities].sort((a, b) => b.length - a.length)) if (take(city)) f.city.push(city)
  for (const [word, kind] of Object.entries(PROPERTY_WORDS)) if (take(word) && !f.property.includes(kind)) f.property.push(kind)
  for (const w of ['children', 'kids', 'kid', 'child']) if (take(w)) f.children = true

  f.level = [...new Set(f.level)].sort() as ProtectionLevel[]
  const rest = t.trim().split(' ').filter(w => w && !STOP.has(w)).join(' ')
  return { filters: f, rest }
}
