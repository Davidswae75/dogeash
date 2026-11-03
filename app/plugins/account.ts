import { watch } from 'vue'
import { defineNuxtPlugin } from '#imports' // nuxt
import { useSupabaseUser } from '#imports' // @nuxtjs/supabase
import { useConversations } from '~/composables/useConversations'
import { useSavedDogs } from '~/composables/useSavedDogs'
import { useSavedSearches } from '~/composables/useSavedSearches'
import { useSession } from '~/composables/useSession'
import { useVisits } from '~/composables/useVisits'

// Loads the signed-in person's account before the first page renders, and again whenever
// someone signs in or out (in this tab or another one). Messages and visits load here for the unread
// and next-visit counts around the site.
export default defineNuxtPlugin(async () => {
  const authUser = useSupabaseUser()
  const { load } = useSession()
  const savedDogs = useSavedDogs()
  const savedSearches = useSavedSearches()
  const conversations = useConversations()
  const visits = useVisits()
  const loadLists = () => Promise.all([savedDogs.load(), savedSearches.load(), conversations.loadMine(), visits.loadMine()])

  await load()
  await loadLists()

  if (import.meta.client) {
    watch(() => authUser.value?.sub, async (id, before) => {
      if (id === before) return
      await load()
      await loadLists()
    })
  }
})
