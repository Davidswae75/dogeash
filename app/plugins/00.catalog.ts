import { defineNuxtPlugin, useRuntimeConfig, useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { DogRow } from '~/utils/dogs'
import type { CareRow } from '~/utils/care'
import type { StoreRow } from '~/utils/stores'
import { careColumns, listedProviders, toCareProvider } from '~/utils/care'
import { dogColumns, listedDogs, toDog } from '~/utils/dogs'
import { listedStores, storeColumns, toStore } from '~/utils/stores'

// The marketplace catalogue: verified stores (with their care teams), their listed dogs and the care directory, read from Supabase once per page
// load on the server and handed to the browser with the page. Runs before the account plugin, so
// shortlists and messages can name their dogs.
// The filters are explicit (not left to access rules) because the catalogue is shared by every
// visitor: a store member's own drafts must never end up in it.
export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient()
  const storageUrl = useRuntimeConfig().public.supabase.url as string
  const rows = useState<{ stores: StoreRow[], dogs: DogRow[], providers: CareRow[] } | null>('catalog', () => null)

  if (!rows.value) {
    const [stores, dogs, providers] = await Promise.all([
      supabase.from('stores').select(storeColumns).eq('status', 'verified').order('rating', { ascending: false }),
      supabase.from('dogs').select(dogColumns).in('status', ['available', 'reserved']).eq('stores.status', 'verified').order('file_no'),
      supabase.from('care_providers').select(careColumns).order('rating', { ascending: false }),
    ])
    // Unreachable database: keep the sample catalogue so the site still browses
    if (stores.error || dogs.error || providers.error) return
    rows.value = { stores: stores.data as unknown as StoreRow[], dogs: dogs.data as unknown as DogRow[], providers: providers.data as unknown as CareRow[] }
  }

  listedStores.value = rows.value.stores.map(r => toStore(r, '', storageUrl))
  listedDogs.value = rows.value.dogs.map(r => toDog(r, storageUrl))
  listedProviders.value = rows.value.providers.map(toCareProvider)
})
