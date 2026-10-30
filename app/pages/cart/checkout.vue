<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'

// Gear checkout: where to deliver, then a preview. Payments aren't connected, so no order is placed.
useSeoMeta({ title: 'Checkout · Dogeash', robots: 'noindex' })

const { user, signedIn } = useSession()
const { count } = useCart()
const placed = ref(false)

// Checkout needs an account and something to buy
onMounted(() => {
  if (!signedIn.value || !count.value) navigateTo('/cart', { replace: true })
})

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(gearCheckoutSchema),
  initialValues: { fullName: user.value?.name },
})
const fields = gearCheckoutFields()
const submit = handleSubmit(() => { placed.value = true })
</script>

<template>
  <div class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col gap-6 px-4 pt-8 sm:px-8 sm:pt-12">
    <ClientOnly>
      <div v-if="placed" class="mx-auto flex max-w-[520px] animate-rise flex-col gap-4 rounded-xl bg-surface p-8 ring-1 ring-line">
        <span class="grid size-12 place-items-center rounded-full bg-marigold text-on-marigold"><AppIcon name="check" :size="24" /></span>
        <h1 class="m-0 mega text-[clamp(28px,3vw,38px)] leading-none">Order <span class="text-outline">ready</span></h1>
        <p class="m-0 text-[15px] leading-6 text-ink-muted">This is a preview: payments aren't connected yet, so no order was placed and nothing was charged. Your cart is still saved.</p>
        <Button as-child variant="outline" class="w-fit"><NuxtLink to="/cart">Back to cart</NuxtLink></Button>
      </div>

      <template v-else>
        <h1 class="m-0 mega text-[clamp(34px,4vw,52px)] leading-none">Check<span class="text-outline">out</span></h1>
        <form class="grid items-start gap-8 pb-8 lg:grid-cols-[1fr_340px]" method="post" novalidate @submit.prevent="submit">
          <div class="rounded-xl bg-surface p-6 ring-1 ring-line sm:p-8">
            <Fields :fields="fields" />
          </div>
          <GearCartSummary class="lg:sticky lg:top-[calc(var(--header-height)+24px)]">
            <Button type="submit" variant="marigold" class="w-full">Place order</Button>
          </GearCartSummary>
        </form>
      </template>
    </ClientOnly>
  </div>
</template>
