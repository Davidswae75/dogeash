<script setup lang="ts">
import { CalendarCheck, PenLine, Stethoscope } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useSeoMeta } from '#imports' // nuxt
import type { CareBooking } from '~/composables/useCareBookings'
import type { Visit } from '~/composables/useVisits'
import type { Review } from '~/utils/reviews'
import { useCareBookings } from '~/composables/useCareBookings'
import { useNotify } from '~/composables/useNotify'
import { useStoreReviews } from '~/composables/useStoreReviews'
import { useVisits } from '~/composables/useVisits'
import { visitDay } from '~/utils/time'

// Kennel visits the buyer has asked for: what's coming up (awaiting the store, or confirmed) and
// everything before. Upcoming visits can be cancelled; a store's confirm or decline shows here.
// A visit the store marked done can be followed by a review of the store.
// Below them, care appointments with vets, trainers and other providers.
useSeoMeta({ title: 'Visits and bookings · My Dogeash' })

const visits = useVisits()
const { upcoming, past } = visits
const notify = useNotify()
const cancelling = ref<Visit>()
const busy = ref(false)

onMounted(visits.loadMine)

const care = useCareBookings()
const { upcoming: careUpcoming, past: carePast } = care
onMounted(care.loadMine)
const cancellingCare = ref<CareBooking>()
async function cancelCare() {
  const b = cancellingCare.value
  if (!b) return
  busy.value = true
  const error = await care.cancel(b.id)
  busy.value = false
  cancellingCare.value = undefined
  if (error) notify.failed(error)
  else notify.visitUpdated('Appointment cancelled', `${b.providerName} · ${visitDay(b.day).label}, ${b.slot}. We've let them know.`)
}

// Reviewing: load the store's reviews first, so an existing review of yours opens for editing
const reviews = useStoreReviews()
const reviewing = ref<Visit>()
const reviewOpen = ref(false)
const myReview = ref<Review>()
async function openReview(v: Visit) {
  myReview.value = (await reviews.load(v.storeId)).find(r => r.mine)
  reviewing.value = v
  reviewOpen.value = true
}

async function cancel() {
  const v = cancelling.value
  if (!v) return
  busy.value = true
  const error = await visits.setStatus(v.id, 'cancelled')
  busy.value = false
  cancelling.value = undefined
  if (error) notify.failed(error)
  else notify.visitUpdated('Visit cancelled', `${v.storeName} · ${visitDay(v.day).label}, ${v.slot}. We've let the store know.`)
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <AccountHeading kicker="Visits and bookings" title="Your" outline="visits" text="Kennel visits and care appointments you've asked for. The store or provider confirms the time with you." />

    <section class="flex flex-col gap-3" aria-labelledby="upcoming-visits">
      <h2 id="upcoming-visits" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">Coming up · {{ upcoming.length }}</h2>
      <VisitCard v-for="v in upcoming" :key="v.id" :visit="v" side="buyer">
        <Button variant="outline" size="sm" @click="cancelling = v">Cancel visit</Button>
        <Button variant="ghost" size="sm" as-child><NuxtLink :to="`/stores/${v.storeSlug}`">View store</NuxtLink></Button>
      </VisitCard>
      <div v-if="!upcoming.length" class="flex flex-col items-center gap-4 rounded-xl bg-surface px-6 py-12 text-center ring-1 ring-line">
        <span class="grid size-14 place-items-center rounded-full bg-marigold-soft"><CalendarCheck class="size-6" aria-hidden="true" /></span>
        <h3 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">Nothing booked</h3>
        <p class="m-0 max-w-[32em] text-[15px] leading-6 text-ink-muted">Meet a dog before you decide. Book a kennel visit from any dog or store page, or from your shortlist.</p>
        <Button as-child><NuxtLink to="/account/shortlist">Go to my shortlist</NuxtLink></Button>
      </div>
    </section>

    <section v-if="past.length" class="flex flex-col gap-3" aria-labelledby="past-visits">
      <h2 id="past-visits" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">Earlier · {{ past.length }}</h2>
      <VisitCard v-for="v in past" :key="v.id" :visit="v" side="buyer" muted>
        <Button v-if="v.status === 'done'" variant="outline" size="sm" @click="openReview(v)"><PenLine aria-hidden="true" />Review {{ v.storeName }}</Button>
      </VisitCard>
    </section>

    <ReviewDialog
      v-if="reviewing"
      v-model:open="reviewOpen"
      :store-name="reviewing.storeName"
      :existing="myReview"
      :save="values => reviews.write(reviewing!.storeId, reviewing!.storeName, values)"
      :remove="myReview ? () => reviews.remove(myReview!) : undefined"
    />

    <section class="flex flex-col gap-3" aria-labelledby="care-bookings">
      <h2 id="care-bookings" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">Care appointments · {{ careUpcoming.length }}</h2>
      <CareBookingCard
        v-for="b in careUpcoming"
        :key="b.id"
        side="buyer"
        :service="b.service" :day="b.day" :slot="b.slot" :place="b.place" :status="b.status"
        :who="b.providerName" :who-to="`/care/${b.providerSlug}`" :dog-name="b.dogName" :shared="b.shareRecord" :provider-note="b.providerNote"
      >
        <Button variant="outline" size="sm" @click="cancellingCare = b">Cancel appointment</Button>
      </CareBookingCard>
      <CareBookingCard
        v-for="b in carePast"
        :key="b.id"
        side="buyer"
        muted
        :service="b.service" :day="b.day" :slot="b.slot" :place="b.place" :status="b.status"
        :who="b.providerName" :who-to="`/care/${b.providerSlug}`" :dog-name="b.dogName" :provider-note="b.providerNote"
      >
        <Button v-if="b.status === 'done' && b.ownedDogId" variant="outline" size="sm" as-child><NuxtLink :to="`/account/dogs/${b.ownedDogId}`">See {{ b.dogName }}'s record</NuxtLink></Button>
      </CareBookingCard>
      <div v-if="!careUpcoming.length && !carePast.length" class="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-dashed border-line-strong p-4">
        <Stethoscope class="size-5 text-ink-muted" aria-hidden="true" />
        <span class="min-w-0 flex-1 text-sm text-ink-muted">Vets, trainers and groomers you book show here. Let them add the visit to your dog's record as they go.</span>
        <Button variant="outline" size="sm" as-child><NuxtLink to="/care">Find care</NuxtLink></Button>
      </div>
    </section>

    <ConfirmDialog
      v-if="cancellingCare"
      :open="!!cancellingCare"
      :title="`Cancel your appointment with ${cancellingCare.providerName}?`"
      :description="`${cancellingCare.service}, ${visitDay(cancellingCare.day).label} at ${cancellingCare.slot}. They're told straight away; you can book another time.`"
      confirm-label="Cancel appointment"
      :run="async () => { await cancelCare(); return null }"
      @update:open="o => !o && (cancellingCare = undefined)"
    />

    <AlertDialog :open="!!cancelling" @update:open="o => !o && (cancelling = undefined)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this visit?</AlertDialogTitle>
          <AlertDialogDescription v-if="cancelling">
            {{ cancelling.service }} with {{ cancelling.storeName }}, {{ visitDay(cancelling.day).label }} at {{ cancelling.slot }}. The store sees it's cancelled; you can book another time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <Button :loading="busy" @click="cancel">Cancel visit</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
