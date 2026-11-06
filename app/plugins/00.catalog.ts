import { defineNuxtPlugin } from '#imports' // nuxt
import { useCatalog } from '~/composables/useCatalog'

// The marketplace catalogue, before anything else runs, so shortlists and messages can name their dogs
export default defineNuxtPlugin(async () => {
  await useCatalog().load()
})
