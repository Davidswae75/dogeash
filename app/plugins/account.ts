import { watch } from 'vue'
import { defineNuxtPlugin } from '#imports' // nuxt
import { useSupabaseUser } from '#imports' // @nuxtjs/supabase
import { useConversations } from '~/composables/useConversations'
import { useNotifications } from '~/composables/useNotifications'
import { useSavedDogs } from '~/composables/useSavedDogs'
import { useSavedSearches } from '~/composables/useSavedSearches'
import { useSession } from '~/composables/useSession'
import { useStaff } from '~/composables/useStaff'
import { useAccountBlock } from '~/composables/useAccountBlock'
import { useStoreInvites } from '~/composables/useStoreInvites'
import { useVisits } from '~/composables/useVisits'

// Loads the signed-in person's account before the first page renders, and again whenever
// someone signs in or out (in this tab or another one). Messages, visits and notifications load here for the unread
// and next-visit counts around the site and the bell.
export default defineNuxtPlugin(async () => {
  const authUser = useSupabaseUser()
  const { load } = useSession()
  const savedDogs = useSavedDogs()
  const savedSearches = useSavedSearches()
  const conversations = useConversations()
  const visits = useVisits()
  const notifications = useNotifications()
  const storeInvites = useStoreInvites()
  const staff = useStaff()
  const accountBlock = useAccountBlock()
  const loadLists = () => Promise.all([savedDogs.load(), savedSearches.load(), conversations.loadMine(), visits.loadMine(), notifications.load(), storeInvites.load(), staff.load(), accountBlock.load()])

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
