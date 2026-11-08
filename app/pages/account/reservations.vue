<script setup lang="ts">
import { CircleAlert, CircleCheck, Loader2, ShieldCheck } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter, useSeoMeta } from '#imports' // nuxt
import type { Reservation } from '~/utils/reservations'
import { useReservations } from '~/composables/useReservations'
import { formatMoney, moneyRules, reservationStatus } from '~/utils/reservations'

// Dogs the buyer has put a deposit on: the hold and its countdown, paying the balance, confirming the
// handover, and what happened to the money when one ended early. Paystack sends the buyer back here
// after paying (?reference=…), and the page has the server check that payment before showing anything.
useSeoMeta({ title: 'Reservations · My Dogeash' })

const reservations = useReservations()
const { active, earlier, unfinished, loaded } = reservations
// Earlier ones worth showing: money changed hands (a checkout that was never paid isn't)
const pastShown = computed(() => earlier.value.filter(r => r.depositPaidAt || r.refunds.length))
// The past reservation whose full card is open
const pastOpen = ref<Reservation>()
const route = useRoute()
const router = useRouter()

// The banner after coming back from Paystack
type Banner = { tone: 'good' | 'bad' | 'wait', title: string, text: string }
const banner = ref<Banner>()
const checking = ref(false)

const outcomes: Record<string, (r?: Reservation) => Banner> = {
  held: r => ({ tone: 'good', title: `${r?.dogName ?? 'The dog'} is reserved for you`, text: `Deposit received. Pay the balance within ${moneyRules.holdDays} days; until then nobody else can reserve or buy them.` }),
  paid: r => ({ tone: 'good', title: 'Paid in full', text: `Dogeash holds the money until you confirm the handover of ${r?.dogName ?? 'your dog'}. The store will arrange it with you.` }),
  already: () => ({ tone: 'good', title: 'Payment received', text: 'This payment was already recorded.' }),
  failed: () => ({ tone: 'bad', title: 'The payment didn\'t go through', text: 'Nothing was charged. You can try again below.' }),
  refund: () => ({ tone: 'bad', title: 'Paid, but the dog was no longer free', text: 'Your money is on its way back. Refunds take 3 to 10 working days to reach your bank.' }),
  waiting: () => ({ tone: 'wait', title: 'Paystack is still confirming your payment', text: 'This can take a few minutes for a bank transfer. This page updates when it\'s done, and you\'ll get a notification.' }),
}

onMounted(async () => {
  const reference = String(route.query.reference ?? route.query.trxref ?? '')
  const cancelled = route.query.cancelled
  if (reference || cancelled) router.replace({ query: {} })
  if (cancelled) banner.value = { tone: 'bad', title: 'Payment cancelled', text: 'Nothing was charged. The dog stays free for anyone to reserve.' }
  if (!reference) return reservations.load()

  checking.value = true
  const result = await reservations.verify(reference)
  checking.value = false
  if ('error' in result) {
    banner.value = { tone: 'bad', title: 'We couldn\'t check that payment yet', text: `${result.error} If money left your account, it will show here within a few minutes.` }
    return reservations.load()
  }
  const r = reservations.mine.value.find(x => x.id === (result as { reservationId?: string }).reservationId)
  banner.value = (outcomes[result.outcome] ?? outcomes.already!)(r)
  // A transfer still being confirmed: look again shortly
  if (result.outcome === 'waiting') setTimeout(async () => {
    const again = await reservations.verify(reference)
    if (!('error' in again) && again.outcome !== 'waiting') banner.value = (outcomes[again.outcome] ?? outcomes.already!)(reservations.mine.value.find(x => x.id === (again as { reservationId?: string }).reservationId))
  }, 20_000)
})

// Actions on a reservation
const busyId = ref('')
const actionError = ref<Record<string, string>>({})
async function payBalance(r: Reservation) {
  busyId.value = r.id
  const error = await reservations.payBalance(r.id)
  if (error) {
    actionError.value = { ...actionError.value, [r.id]: error }
    busyId.value = ''
  }
}
async function finishCheckout(r: Reservation) {
  busyId.value = r.id
  const error = await reservations.reserve(r.dogFileNo)
  if (error) {
    actionError.value = { ...actionError.value, [r.id]: error }
    busyId.value = ''
  }
}
const cancelling = ref<Reservation>()
const cancelOpen = ref(false)
const confirming = ref<Reservation>()
const confirmOpen = ref(false)
</script>

<template>
  <div class="flex flex-col gap-8">
    <AccountHeading kicker="Reservations" title="Your" outline="reservations" :text="`Dogs you've put a deposit on. Dogeash holds your money until you confirm the handover, and the store is paid after that.`" />

    <div v-if="checking" class="flex items-center gap-3 rounded-xl bg-surface p-4 ring-1 ring-line" role="status">
      <Loader2 class="size-5 animate-spin text-marigold" aria-hidden="true" />
      <span class="text-sm font-semibold">Checking your payment with Paystack…</span>
    </div>
    <div
      v-else-if="banner"
      :class="['flex gap-3 rounded-xl p-4 ring-1', banner.tone === 'good' ? 'bg-marigold-soft ring-marigold/40' : banner.tone === 'bad' ? 'bg-surface ring-danger/40' : 'bg-surface ring-line']"
      role="status"
    >
      <CircleCheck v-if="banner.tone === 'good'" class="mt-0.5 size-5 shrink-0 text-marigold-ink dark:text-marigold" aria-hidden="true" />
      <CircleAlert v-else-if="banner.tone === 'bad'" class="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
      <Loader2 v-else class="mt-0.5 size-5 shrink-0 animate-spin text-ink-muted" aria-hidden="true" />
      <div class="flex flex-col gap-0.5">
        <strong class="text-[15px]">{{ banner.title }}</strong>
        <span class="text-sm leading-[21px] text-ink-muted">{{ banner.text }}</span>
      </div>
    </div>

    <section class="flex flex-col gap-3" aria-labelledby="active-reservations">
      <h2 id="active-reservations" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">In progress · {{ active.length }}</h2>
      <ListSkeleton v-if="!loaded && !checking" :rows="2" label="Loading your reservations" />
      <AccountReservationCard v-for="r in active" :key="r.id" :reservation="r">
        <template v-if="r.status === 'held'">
          <Button variant="marigold" :loading="busyId === r.id" @click="payBalance(r)">Pay the {{ formatMoney(r.balanceNaira) }} balance</Button>
          <Button variant="ghost" @click="cancelling = r; cancelOpen = true">Cancel reservation</Button>
        </template>
        <template v-else-if="r.status === 'paid'">
          <Button variant="marigold" @click="confirming = r; confirmOpen = true">I have {{ r.dogName }}: confirm the handover</Button>
          <span class="basis-full text-[13px] text-ink-muted">Something wrong at the handover? Don't confirm. Contact Dogeash and the money stays held.</span>
        </template>
        <p v-if="actionError[r.id]" class="m-0 basis-full text-sm font-semibold text-danger" role="alert">{{ actionError[r.id] }}</p>
      </AccountReservationCard>

      <!-- Started paying but didn't finish, and the dog is still held for them for a few minutes -->
      <div v-for="r in unfinished" :key="r.id" class="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-dashed border-line-strong p-4">
        <span class="min-w-0 flex-1 text-sm"><strong>{{ r.dogName }}</strong>: the deposit checkout wasn't finished.</span>
        <Button size="sm" variant="marigold" :loading="busyId === r.id" @click="finishCheckout(r)">Pay {{ formatMoney(r.depositNaira) }} deposit</Button>
        <p v-if="actionError[r.id]" class="m-0 basis-full text-sm font-semibold text-danger" role="alert">{{ actionError[r.id] }}</p>
      </div>

      <div v-if="loaded && !active.length && !unfinished.length && !checking" class="flex flex-col items-center gap-4 rounded-xl bg-surface px-6 py-12 text-center ring-1 ring-line">
        <span class="grid size-14 place-items-center rounded-full bg-marigold-soft"><ShieldCheck class="size-6" aria-hidden="true" /></span>
        <h3 class="m-0 font-display text-2xl font-extrabold font-stretch-expanded">No reservations</h3>
        <p class="m-0 max-w-[32em] text-[15px] leading-6 text-ink-muted">Found the one? Reserve it from its page with a {{ moneyRules.depositPercent }}% deposit. It's held for you for {{ moneyRules.holdDays }} days while you arrange the handover.</p>
        <Button as-child><NuxtLink to="/account/shortlist">Go to my shortlist</NuxtLink></Button>
      </div>
    </section>

    <section v-if="pastShown.length" class="flex flex-col gap-3" aria-labelledby="earlier-reservations">
      <h2 id="earlier-reservations" class="m-0 font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">Earlier · {{ pastShown.length }}</h2>
      <!-- One line each; the full card opens in a dialog -->
      <SummaryRow
        v-for="r in pastShown"
        :key="r.id"
        :title="r.dogName"
        :subtitle="`${r.storeName} · ${reservationStatus[r.status].label}`"
        :meta="formatMoney(r.paidNaira)"
        :name="r.dogName"
        :photo="r.photo"
        @click="pastOpen = r"
      />
    </section>

    <DetailDialog :open="!!pastOpen" :title="pastOpen?.dogName ?? ''" :subtitle="pastOpen ? `${pastOpen.storeName} · ${pastOpen.ref}` : ''" :sections="[]" @update:open="o => !o && (pastOpen = undefined)">
      <AccountReservationCard v-if="pastOpen" :reservation="pastOpen" muted>
        <Button v-if="pastOpen.status === 'completed'" variant="outline" size="sm" as-child><NuxtLink to="/account/dogs/new">Start {{ pastOpen.dogName }}'s care record</NuxtLink></Button>
      </AccountReservationCard>
    </DetailDialog>

    <ConfirmDialog
      v-if="cancelling"
      v-model:open="cancelOpen"
      :title="`Cancel the reservation of ${cancelling.dogName}?`"
      :description="`${cancelling.dogName} goes back on sale straight away. Dogeash then contacts you about your ${formatMoney(cancelling.depositNaira)} deposit.`"
      confirm-label="Cancel reservation"
      :run="() => reservations.cancel(cancelling!.id)"
    />
    <ConfirmDialog
      v-if="confirming"
      v-model:open="confirmOpen"
      :title="`Do you have ${confirming.dogName}?`"
      :description="`Confirming tells Dogeash to pay ${confirming.storeName}. Only confirm once ${confirming.dogName} is with you and matches the listing. This can't be undone.`"
      confirm-label="Confirm the handover"
      tone="marigold"
      :run="() => reservations.confirmHandover(confirming!.id)"
    />
  </div>
</template>
