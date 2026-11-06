<script setup lang="ts">
import { BadgeCheck, CalendarClock, CircleAlert, Clock, FilePen } from '@lucide/vue'
import type { Component } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useStoreContext } from '~/composables/useStoreContext'
import { shortTime } from '~/utils/time'

// Where the store stands with Dogeash, at the top of every dashboard page: a draft, in review, suspended
// (with Dogeash's note), newly approved (for a week after), or due its yearly re-inspection (30 days before,
// and once it has run out). Nothing otherwise.
const { store, membership, storeUuid } = useStoreContext()
const supabase = useSupabaseClient()
const verifiedUntil = ref<string | null>(null)
onMounted(async () => {
  const id = await storeUuid()
  if (!id || store.value.status !== 'verified') return
  const { data } = await supabase.rpc('my_store_verification', { target: id })
  verifiedUntil.value = (data as string | null) ?? null
})

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
    case 'verified': {
      const left = verifiedUntil.value ? Math.round((new Date(`${verifiedUntil.value}T12:00:00`).getTime() - Date.now()) / 864e5) : null
      const until = verifiedUntil.value ? new Date(`${verifiedUntil.value}T12:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'long' }) : ''
      if (left !== null && left < 0) return { icon: CalendarClock, tone: 'bg-danger/10 ring-danger/40 text-ink', title: `${s.name}'s verification ran out on ${until}`, text: 'Stores are inspected every year. Dogeash will call to book your re-inspection; until then your store may be hidden.' }
      if (left !== null && left <= 30) return { icon: CalendarClock, tone: 'bg-marigold-soft ring-marigold/50 text-ink', title: `${s.name}'s verification runs out on ${until}`, text: 'Stores are inspected every year. Dogeash will call to book your re-inspection; keep your vet records ready.' }
      return s.statusChangedAt && Date.now() - new Date(s.statusChangedAt).getTime() < WEEK
        ? { icon: BadgeCheck, tone: 'bg-marigold-soft ring-marigold/50 text-ink', title: `${s.name} is approved${when}`, text: `Your store is live. Put your dogs live from Dogs.${note}` }
        : null
    }
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
