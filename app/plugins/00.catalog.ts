import { defineNuxtPlugin, useRuntimeConfig, useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { DogRow } from '~/utils/dogs'
import type { StoreRow } from '~/utils/stores'
import { dogColumns, listedDogs, toDog } from '~/utils/dogs'
import { listedStores, storeColumns, toStore } from '~/utils/stores'

// The marketplace catalogue: verified stores and their listed dogs, read from Supabase once per page
// load on the server and handed to the browser with the page. Runs before the account plugin, so
// shortlists and messages can name their dogs.
// The filters are explicit (not left to access rules) because the catalogue is shared by every
// visitor: a store member's own drafts must never end up in it.
export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient()
  const storageUrl = useRuntimeConfig().public.supabase.url as string
  const rows = useState<{ stores: StoreRow[], dogs: DogRow[] } | null>('catalog', () => null)

  if (!rows.value) {
    const [stores, dogs] = await Promise.all([
      supabase.from('stores').select(storeColumns).eq('status', 'verified').order('rating', { ascending: false }),
      supabase.from('dogs').select(dogColumns).in('status', ['available', 'reserved']).eq('stores.status', 'verified').order('file_no'),
    ])
    // Unreachable database: keep the sample catalogue so the site still browses
    if (stores.error || dogs.error) return
    rows.value = { stores: stores.data as unknown as StoreRow[], dogs: dogs.data as unknown as DogRow[] }
  }

  listedStores.value = rows.value.stores.map(r => toStore(r, '', storageUrl))
  listedDogs.value = rows.value.dogs.map(r => toDog(r, storageUrl))
})
