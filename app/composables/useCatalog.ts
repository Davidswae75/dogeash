import { useRuntimeConfig, useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { CareRow } from '~/utils/care'
import type { DogRow } from '~/utils/dogs'
import type { StoreRow } from '~/utils/stores'
import { careColumns, listedProviders, toCareProvider } from '~/utils/care'
import { dogColumns, listedDogs, toDog } from '~/utils/dogs'
import { listedStores, storeColumns, toStore } from '~/utils/stores'

type CatalogRows = { stores: StoreRow[], dogs: DogRow[], providers: CareRow[] }

// The marketplace catalogue: verified stores (with their care teams), their listed dogs and the care directory.
// Read once per page load (on the server, handed to the browser with the page), and again when someone
// leaves the store dashboard or admin, where they may have just changed what buyers see.
// The filters are explicit (not left to access rules) because the catalogue is shared by every
// visitor: a store member's own drafts must never end up in it.
export function useCatalog() {
  const supabase = useSupabaseClient()
  const storageUrl = useRuntimeConfig().public.supabase.url as string
  const rows = useState<CatalogRows | null>('catalog', () => null)

  async function fetchRows(): Promise<CatalogRows | null> {
    const [stores, dogs, providers] = await Promise.all([
      supabase.from('stores').select(storeColumns).eq('status', 'verified').order('rating', { ascending: false }),
      supabase.from('dogs').select(dogColumns).in('status', ['available', 'reserved']).eq('stores.status', 'verified').order('file_no'),
      supabase.from('care_providers').select(careColumns).eq('listed', true).order('rating', { ascending: false }),
    ])
    if (stores.error || dogs.error || providers.error) return null
    return { stores: stores.data as unknown as StoreRow[], dogs: dogs.data as unknown as DogRow[], providers: providers.data as unknown as CareRow[] }
  }

  // `fresh` reads it again even when this page load already has it.
  // Unreachable database: keep what's there (or the sample catalogue) so the site still browses.
  async function load(fresh = false) {
    if (!rows.value || fresh) rows.value = (await fetchRows()) ?? rows.value
    if (!rows.value) return
    listedStores.value = rows.value.stores.map(r => toStore(r, '', storageUrl))
    listedDogs.value = rows.value.dogs.map(r => toDog(r, storageUrl))
    listedProviders.value = rows.value.providers.map(r => toCareProvider(r, storageUrl))
  }

  return { load }
}
