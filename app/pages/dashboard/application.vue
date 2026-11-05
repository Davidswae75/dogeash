<script setup lang="ts">
import { BadgeCheck, Clock, Send } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import { useSession } from '~/composables/useSession'
import { useStoreApplication } from '~/composables/useStoreApplication'
import { useStoreContext } from '~/composables/useStoreContext'
import { useStoreDogs } from '~/composables/useStoreDogs'
import { visitDay } from '~/utils/time'
import { inspectionWhen } from '~/utils/inspections'

// The store's application to go live (owner only). While a draft: a checklist, the kennel's address and
// inspection days, the documents, then Send for review. In review: everything locked, and when it was sent.
// Sent back: open again, with Dogeash's note in the banner above. Verified: done.
definePageMeta({ layout: 'dashboard', title: 'Application', middleware: 'store-member' })
useSeoMeta({ title: 'Application · Store dashboard · Dogeash', robots: 'noindex' })

const { membership, store, can } = useStoreContext()
const { user } = useSession()
const application = useStoreApplication()
const { app, inspection, loaded, locked } = application
const storeDogs = useStoreDogs()
onMounted(() => Promise.all([application.load(), storeDogs.load()]))

const checklist = ref<{ remaining: number }>()
const ready = computed(() => checklist.value?.remaining === 0)
const confirming = ref(false)
const busy = ref(false)
const error = ref('')
async function send() {
  busy.value = true
  error.value = (await application.submit()) ?? ''
  busy.value = false
  confirming.value = false
}
const sentOn = computed(() => (app.value?.submitted_at ? new Date(app.value.submitted_at).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' }) : ''))
</script>

<template>
  <DashboardNoAccess v-if="!can('settings')" title="The application" />
  <div v-else-if="membership" class="flex max-w-[860px] flex-col gap-5">
    <!-- Where the application stands -->
    <section v-if="store.status === 'verified'" class="flex items-start gap-3 rounded-xl bg-marigold-soft px-5 py-4 ring-1 ring-marigold/50">
      <BadgeCheck class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span class="flex flex-col gap-1"><strong>{{ store.name }} is verified.</strong><span class="text-sm text-ink-muted">Your store is live. Put your dogs live from <NuxtLink to="/dashboard/dogs" class="font-bold text-ink">Dogs</NuxtLink>.</span></span>
    </section>
    <section v-else-if="store.status === 'in_review'" class="flex items-start gap-3 rounded-xl bg-surface px-5 py-4 ring-1 ring-line">
      <Clock class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span class="flex flex-col gap-1">
        <strong>Your application is with Dogeash<template v-if="sentOn"> (sent {{ sentOn }})</template>.</strong>
        <span v-if="inspection?.status === 'scheduled'" class="text-sm text-ink-muted">
          <strong class="text-ink">Inspection booked: {{ inspectionWhen(inspection.scheduled_for) }}</strong> with {{ inspection.inspector }} from Dogeash. Have your dogs' vet records and microchip numbers ready. Your details are locked while we review them.
        </span>
        <span v-else class="text-sm text-ink-muted">
          We'll call {{ app?.contact_phone || 'you' }} to confirm the inspection<template v-if="app?.preferred_days.length"> on one of {{ app.preferred_days.map(d => visitDay(d).label).join(', ') }}</template>. Your details are locked while we review them.
        </span>
      </span>
    </section>
    <p v-else class="m-0 max-w-[44em] text-[15px] leading-6 text-ink-muted">
      Buyers see {{ store.name }} once Dogeash has inspected the kennel. Fill this in, send it, and we'll call to arrange the visit.
    </p>

    <template v-if="loaded && store.status !== 'verified'">
      <DashboardApplicationChecklist v-if="!locked" ref="checklist" :store="store" :dogs="storeDogs.dogs.value.length" :app="app" />
      <DashboardApplicationForm :key="`${app?.updated_at ?? 'new'}-${locked}`" :app="app" :phone="user?.phone ?? ''" :locked="locked" :save="application.save" />
      <DashboardApplicationDocs :app="app" :locked="locked" :upload="application.uploadDoc" :open="application.openDoc" />

      <div v-if="!locked" class="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-1 py-3 backdrop-blur">
        <p v-if="error" class="m-0 w-full text-sm font-semibold text-danger" role="alert">{{ error }}</p>
        <Button variant="marigold" :disabled="!ready" @click="confirming = true"><Send aria-hidden="true" />Send for review</Button>
        <span class="text-[13px] text-ink-muted">{{ ready ? 'Everything\'s in. Dogeash reviews applications within a few working days.' : `${checklist?.remaining ?? '…'} to go before you can send.` }}</span>
      </div>
    </template>

    <AlertDialog v-model:open="confirming">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send {{ store.name }} for review?</AlertDialogTitle>
          <AlertDialogDescription>Dogeash checks your documents and calls to arrange the inspection. You can't change the application while we review it; if something needs fixing, we'll send it back with a note.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not yet</AlertDialogCancel>
          <Button variant="marigold" :loading="busy" @click="send">Send for review</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
