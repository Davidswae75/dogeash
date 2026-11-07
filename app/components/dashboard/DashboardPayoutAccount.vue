<script setup lang="ts">
import { Landmark, Pencil } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import type { PayoutAccount } from '~/composables/useStoreMoney'

// Where the store's payouts go. Paystack checks the number with the bank and shows the name on the
// account; Dogeash keeps only the bank, that name and the last four digits.
const props = defineProps<{
  account: PayoutAccount | null
  banks: { name: string, code: string }[]
  loadBanks: () => Promise<string | null>
  save: (bankCode: string, accountNumber: string) => Promise<string | null>
}>()

const editing = ref(!props.account)
watch(() => props.account, (a) => { if (!a) editing.value = true })
const bank = ref('')
const number = ref('')
const busy = ref(false)
const error = ref('')
const bankOptions = computed(() => props.banks.map(b => ({ value: b.code, label: b.name })))

watch(editing, async (e) => { if (e) error.value = (await props.loadBanks()) ?? '' }, { immediate: true })

async function submit() {
  error.value = ''
  if (!bank.value) return (error.value = 'Choose the bank.')
  if (number.value.replace(/\D/g, '').length !== 10) return (error.value = 'Nigerian account numbers have 10 digits.')
  busy.value = true
  error.value = (await props.save(bank.value, number.value)) ?? ''
  busy.value = false
  if (!error.value) {
    editing.value = false
    number.value = ''
  }
}
</script>

<template>
  <section class="flex flex-col gap-4 rounded-xl bg-surface p-5 ring-1 ring-line" aria-labelledby="payout-account">
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col gap-1">
        <h2 id="payout-account" class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Bank account</h2>
        <p class="m-0 text-[13px] leading-5 text-ink-muted">Where your payouts go. Only the owner can change it.</p>
      </div>
      <Button v-if="props.account && !editing" variant="outline" size="sm" @click="editing = true"><Pencil aria-hidden="true" />Change</Button>
    </div>

    <div v-if="props.account && !editing" class="flex items-center gap-3 rounded-lg bg-canvas p-3 ring-1 ring-line">
      <span class="grid size-10 shrink-0 place-items-center rounded-full bg-marigold-soft"><Landmark class="size-5" aria-hidden="true" /></span>
      <span class="flex min-w-0 flex-col">
        <strong class="truncate text-sm">{{ props.account.account_name }}</strong>
        <span class="text-[13px] text-ink-muted">{{ props.account.bank_name }} · <span class="font-mono">•••• {{ props.account.account_last4 }}</span></span>
      </span>
    </div>

    <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <FieldShell label="Bank" for="payout-bank">
        <SearchSelect id="payout-bank" v-model="bank" :options="bankOptions" placeholder="Choose your bank" search-placeholder="Type your bank's name" empty="No bank by that name" class="h-11" />
      </FieldShell>
      <FieldShell label="Account number" for="payout-number" hint="10 digits. The bank confirms the name on the account before it's saved.">
        <Input id="payout-number" v-model="number" inputmode="numeric" maxlength="10" placeholder="0123456789" class="h-11 border-line-strong bg-surface font-mono" />
      </FieldShell>
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <div class="flex flex-wrap gap-2">
        <Button type="submit" variant="marigold" :loading="busy">Check and save</Button>
        <Button v-if="props.account" type="button" variant="ghost" @click="editing = false">Keep the current account</Button>
      </div>
    </form>
  </section>
</template>
