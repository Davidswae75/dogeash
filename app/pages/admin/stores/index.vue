<script setup lang="ts">
import { onMounted } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useAdmin } from '~/composables/useAdmin'

// Admin › Stores: every store with its status, and approving, declining, suspending or restoring it
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Stores · Dogeash admin', robots: 'noindex' })

const { stores, loadStores } = useAdmin()
onMounted(loadStores)
</script>

<template>
  <AdminPage title="Stores" :count="stores.length" description="Every store on Dogeash, drafts included. Approving makes a store and its live dogs visible to buyers; declining or suspending hides them at once.">
    <AdminStores />
  </AdminPage>
</template>
