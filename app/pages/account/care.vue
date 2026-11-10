<script setup lang="ts">
import { Stethoscope } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useSeoMeta } from '#imports' // nuxt
import type { CareBooking } from '~/composables/useCareBookings'
import { useCareBookings } from '~/composables/useCareBookings'
import { useNotify } from '~/composables/useNotify'
import { visitDay } from '~/utils/time'

// Care appointments with vets, trainers, groomers and other providers: what's coming up and everything before.
// A booking still awaiting the provider's reply can be changed; any upcoming one can be cancelled. A done
// appointment links to the dog's record when the provider added to it. Kennel visits are on /account/visits.
useSeoMeta({ title: 'Care appointments · My Dogeash' })

const notify = useNotify()
const busy = ref(false)
const care = useCareBookings()
const { upcoming: careUpcoming, past: carePast, loaded: careLoaded } = care
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
</script>

<template>
  <div class="flex flex-col gap-8">
    <AccountHeading kicker="Care appointments" title="Your" outline="care" text="Appointments with vets, trainers and groomers. The provider confirms the time with you; until they do, you can change it." />

    <section class="flex flex-col gap-3" aria-labelledby="care-upcoming">
      <h2 id="care-upcoming" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">Coming up · {{ careUpcoming.length }}</h2>
      <ListSkeleton v-if="!careLoaded" :rows="1" label="Loading care appointments" />
      <CareBookingCard
        v-for="b in careUpcoming"
        :key="b.id"
        side="buyer"
        :service="b.services.join(', ')" :day="b.day" :slot="b.slot" :place="b.place" :status="b.status"
        :who="b.providerName" :who-to="b.providerSlug ? `/care/${b.providerSlug}` : undefined" :dog-name="b.dogName" :shared="b.shareRecord" :provider-note="b.providerNote"
      >
        <!-- Until the provider answers, the buyer can change it; after that it's fixed (cancel and book again) -->
        <CareBookingChange v-if="b.status === 'requested'" :booking="b" />
        <Button variant="outline" size="sm" @click="cancellingCare = b">Cancel appointment</Button>
        <span v-if="b.status === 'confirmed'" class="text-xs text-ink-muted">Confirmed, so it can't be changed. Cancel it to book another time.</span>
      </CareBookingCard>
      <div v-if="careLoaded && !careUpcoming.length" class="flex flex-col items-center gap-4 rounded-xl bg-surface px-6 py-12 text-center ring-1 ring-line">
        <span class="grid size-14 place-items-center rounded-full bg-marigold-soft"><Stethoscope class="size-6" aria-hidden="true" /></span>
        <h3 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">No appointments coming up</h3>
        <p class="m-0 max-w-[32em] text-[15px] leading-6 text-ink-muted">Book a vet, trainer or groomer, and let them add the visit to your dog's record as they go.</p>
        <Button as-child><NuxtLink to="/care">Find care</NuxtLink></Button>
      </div>
    </section>

    <section v-if="carePast.length" class="flex flex-col gap-3" aria-labelledby="care-earlier">
      <h2 id="care-earlier" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">Earlier · {{ carePast.length }}</h2>
      <CareBookingCard
        v-for="b in carePast"
        :key="b.id"
        side="buyer"
        muted
        :service="b.services.join(', ')" :day="b.day" :slot="b.slot" :place="b.place" :status="b.status"
        :who="b.providerName" :who-to="b.providerSlug ? `/care/${b.providerSlug}` : undefined" :dog-name="b.dogName" :provider-note="b.providerNote"
      >
        <Button v-if="b.status === 'done' && b.ownedDogId" variant="outline" size="sm" as-child><NuxtLink :to="`/account/dogs/${b.ownedDogId}`">See {{ b.dogName }}'s record</NuxtLink></Button>
      </CareBookingCard>
    </section>

    <ConfirmDialog
      v-if="cancellingCare"
      :open="!!cancellingCare"
      :title="`Cancel your appointment with ${cancellingCare.providerName}?`"
      :description="`${cancellingCare.services.join(', ')}, ${visitDay(cancellingCare.day).label} at ${cancellingCare.slot}. They're told straight away; you can book another time.`"
      confirm-label="Cancel appointment"
      :run="async () => { await cancelCare(); return null }"
      @update:open="o => !o && (cancellingCare = undefined)"
    />

  </div>
</template>
