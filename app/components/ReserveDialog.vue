<script setup lang="ts">
import { BadgeCheck, CalendarClock, ShieldCheck, Undo2 } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import type { AccountGate } from '~/composables/useAccountGate'
import type { Dog } from '~/utils/dogs'
import { useAccountGate } from '~/composables/useAccountGate'
import { useReservations } from '~/composables/useReservations'
import { useSession } from '~/composables/useSession'
import { depositFor, formatMoney, moneyRules } from '~/utils/reservations'

// "Reserve with a deposit" on a dog's page: what the deposit is, what happens to the money, then
// Paystack's checkout. Needs an account. A dog the buyer already reserved links to their reservation.
const props = defineProps<{ dog: Dog, storeName: string, triggerClass?: string }>()

const reservations = useReservations()
const { signedIn } = useSession()
onMounted(() => { if (signedIn.value && !reservations.loaded.value) reservations.load() })
const mine = reservations.forDog(props.dog.fileNo)

const deposit = computed(() => depositFor(props.dog.priceNaira))
const rows = computed(() => [
  { label: 'Price', value: formatMoney(props.dog.priceNaira) },
  { label: `Deposit now (${moneyRules.depositPercent}%)`, value: formatMoney(deposit.value), strong: true },
  { label: `Balance, within ${moneyRules.holdDays} days`, value: formatMoney(props.dog.priceNaira - deposit.value) },
])
const promises = [
  { icon: CalendarClock, text: `${props.dog.name} is held for you for ${moneyRules.holdDays} days. Nobody else can reserve or buy them.` },
  { icon: ShieldCheck, text: 'Dogeash holds your money. The store is paid only after you confirm the handover.' },
  { icon: Undo2, text: `If ${props.storeName} cancels, you get everything back. If you cancel, or the balance isn't paid in ${moneyRules.holdDays} days, Dogeash contacts you about the deposit.` },
]

const open = ref(false)
const gate = computed<AccountGate>(() => ({
  key: `reserve:${props.dog.fileNo}`,
  action: `reserve ${props.dog.name}`,
  reason: 'Your deposit, the hold and the handover are kept on your account.',
}))
const { guard } = useAccountGate(gate, () => { open.value = true })

const busy = ref(false)
const error = ref('')
async function pay() {
  busy.value = true
  error.value = ''
  // On success the browser leaves for Paystack, so the button keeps spinning
  const failed = await reservations.reserve(props.dog.fileNo)
  if (failed) {
    error.value = failed
    busy.value = false
  }
}
</script>

<template>
  <Button v-if="mine" as-child variant="marigold" :class="props.triggerClass">
    <NuxtLink to="/account/reservations"><BadgeCheck aria-hidden="true" />Reserved for you · view</NuxtLink>
  </Button>
  <Button v-else-if="props.dog.status === 'reserved'" variant="marigold" :class="props.triggerClass" disabled>Reserved</Button>
  <Button v-else variant="marigold" :class="props.triggerClass" @click="guard()">Reserve with a {{ formatMoney(deposit) }} deposit</Button>

  <Dialog v-model:open="open">
    <DialogContent class="max-h-[92dvh] overflow-y-auto border-line bg-surface sm:max-w-[500px]">
      <DialogHeader class="text-left">
        <span class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">Reserve · {{ props.dog.fileNo }}</span>
        <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">Reserve {{ props.dog.name }}</DialogTitle>
        <DialogDescription class="text-ink-muted">{{ props.dog.breed }} from {{ props.storeName }}. Pay the deposit now and the rest before the handover.</DialogDescription>
      </DialogHeader>

      <dl class="m-0 flex flex-col divide-y divide-line rounded-lg ring-1 ring-line">
        <div v-for="r in rows" :key="r.label" class="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt class="text-sm text-ink-muted">{{ r.label }}</dt>
          <dd :class="['m-0 font-display tabular-nums font-stretch-expanded', r.strong ? 'text-xl font-extrabold' : 'text-base font-bold']">{{ r.value }}</dd>
        </div>
      </dl>

      <ul class="m-0 flex list-none flex-col gap-3 p-0">
        <li v-for="p in promises" :key="p.text" class="flex gap-3 text-sm leading-[21px]">
          <component :is="p.icon" class="mt-0.5 size-[18px] shrink-0 text-marigold" aria-hidden="true" />{{ p.text }}
        </li>
      </ul>

      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <DialogFooter class="flex-col gap-3 sm:flex-col">
        <Button variant="marigold" class="h-11 w-full" :loading="busy" @click="pay">Pay {{ formatMoney(deposit) }} deposit</Button>
        <p class="m-0 text-center text-xs text-ink-muted">Card, bank transfer or USSD, through Paystack. Want to meet {{ props.dog.name }} first? Book a visit before you reserve.</p>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
