import type { BuyerProfile, SavedSearch } from './account'

// The marketplace rows on Home: which dogs and stores each one shows

// Width and gutters for every band on Home
export const homeSection = 'mx-auto w-full max-w-[calc(var(--container)+64px)] px-4 sm:px-8'

const forSale = () => sampleDogs.filter(d => d.status === 'available')

export const marketRows = {
  availableNow: () => forSale(),
  familyProtection: () => forSale().filter(d => d.level === 4 && d.safeWithChildren),
  forCompounds: () => forSale().filter(d => d.property.includes('compound') && d.level >= 3),
  inCity: (city: string) => sampleDogs.filter(d => d.city === city),
  topStores: () => [...sampleStores].filter(s => s.verified).sort((a, b) => b.rating - a.rating),

  // Signed-in Home: dogs suited to the buyer's property and household, their own city first
  matchedTo: (profile: BuyerProfile, exclude: string[] = []) => {
    const levels = propertyTypes.find(p => p.value === profile.property)?.levels ?? []
    return forSale()
      .filter(d => d.property.includes(profile.property) && levels.includes(d.level) && (!profile.children || d.safeWithChildren) && !exclude.includes(d.fileNo))
      .sort((a, b) => Number(b.city === profile.city) - Number(a.city === profile.city))
  },
  savedSearch: (search: SavedSearch) => forSale().filter(search.matches),
}

// Cities with the most dogs first, for the "Near you" row
export const marketCities = Object.entries(
  sampleDogs.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d.city]: (acc[d.city] ?? 0) + 1 }), {}),
).sort((a, b) => b[1] - a[1]).map(([city]) => city)
