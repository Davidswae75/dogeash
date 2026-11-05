<script setup lang="ts">
import { BadgeCheck, CircleAlert, Clock, FilePen } from '@lucide/vue'
import type { Component } from 'vue'
import { computed } from 'vue'
import { useStoreContext } from '~/composables/useStoreContext'
import { shortTime } from '~/utils/time'

// Where the store stands with Dogeash, at the top of every dashboard page: a draft, in review, suspended
// (with Dogeash's note), or newly approved (for a week after). Nothing once a verified store has settled in.
const { store, membership } = useStoreContext()

const WEEK = 7 * 24 * 60 * 60 * 1000
const banner = computed<{ icon: Component, tone: string, title: string, text: string, link?: { to: string, label: string } } | null>(() => {
  if (!membership.value) return null
  const s = store.value
  const note = s.statusNote ? ` Dogeash says: "${s.statusNote}"` : ''
  const when = s.statusChangedAt ? ` (${shortTime(s.statusChangedAt)})` : ''
  switch (s.status) {
    case 'suspended':
      return { icon: CircleAlert, tone: 'bg-danger/10 ring-danger/40 text-ink', title: `${s.name} is suspended${when}`, text: `Your store and dogs are hidden from buyers.${note} Contact Dogeash to sort it out.` }
    case 'draft':
      return { icon: FilePen, tone: 'bg-surface ring-line-strong text-ink', title: s.statusChangedAt ? `Dogeash sent ${s.name} back${when}` : `${s.name} is a draft`, text: s.statusChangedAt ? `Make the changes, then send the application again.${note}` : 'Fill in your store profile, add your dogs, and send your application. Buyers see your store once Dogeash has inspected it.', link: { to: '/dashboard/application', label: 'Open the application' } }
    case 'in_review':
      return { icon: Clock, tone: 'bg-marigold-soft ring-marigold/50 text-ink', title: `Dogeash is reviewing ${s.name}`, text: `Your store is hidden from buyers until the review and inspection are done.${note}` }
    case 'verified':
      return s.statusChangedAt && Date.now() - new Date(s.statusChangedAt).getTime() < WEEK
        ? { icon: BadgeCheck, tone: 'bg-marigold-soft ring-marigold/50 text-ink', title: `${s.name} is approved${when}`, text: `Your store is live. Put your dogs live from Dogs.${note}` }
        : null
    default:
      return null
  }
})
</script>

<template>
  <div v-if="banner" :class="['mb-6 flex items-start gap-3 rounded-xl px-4 py-3.5 ring-1', banner.tone]" role="status">
    <component :is="banner.icon" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
    <span class="flex flex-col gap-0.5">
      <strong class="text-[15px] leading-5">{{ banner.title }}</strong>
      <span class="text-sm leading-[21px] text-ink-muted">{{ banner.text }}</span>
      <NuxtLink v-if="banner.link && $route.path !== banner.link.to" :to="banner.link.to" class="mt-1 w-fit text-sm font-bold text-ink underline underline-offset-4">{{ banner.link.label }}</NuxtLink>
    </span>
  </div>
</template>
