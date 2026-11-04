<script setup lang="ts">
import { BadgeCheck } from '@lucide/vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useStoreContext } from '~/composables/useStoreContext'
import { useStoreProfile } from '~/composables/useStoreProfile'

// The store profile: what buyers read on the public store page. Owners and managers edit it;
// the inspection record, rating and reviews are Dogeash's and shown here read-only.
definePageMeta({ layout: 'dashboard', title: 'Store profile', middleware: 'store-member' })
useSeoMeta({ title: 'Store profile · Store dashboard · Dogeash', robots: 'noindex' })

const { membership, store, can } = useStoreContext()
const { save, setImage } = useStoreProfile()
</script>

<template>
  <DashboardNoAccess v-if="!can('profile')" title="Store profile" />
  <div v-else-if="membership" class="flex flex-col gap-5">
    <p class="m-0 max-w-[44em] text-[15px] leading-6 text-ink-muted">
      Everything buyers read on your store page. Changes show as soon as you save{{ store.verified ? '.' : ', once your store passes its inspection.' }}
    </p>

    <aside class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-surface-sunk px-5 py-3.5 text-[13px] leading-5 text-ink-muted">
      <span class="flex items-center gap-2 font-semibold text-ink">
        <BadgeCheck class="size-4 text-marigold" aria-hidden="true" />
        {{ store.inspection.status === 'passed' ? `Inspected ${store.inspection.date}` : 'Inspection booked' }}
      </span>
      <span v-if="store.reviews">{{ store.rating }} from {{ store.reviews }} reviews</span>
      <span>The inspection, rating and reviews come from Dogeash and buyers, so they can't be edited here.</span>
    </aside>

    <DashboardStoreImages :store="store" :set="setImage" />
    <DashboardStoreForm :key="store.id" :store="store" :save="save" />
  </div>
</template>
