<script setup lang="ts">
import { Check } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { useSeoMeta } from '#imports'
import { useNotify } from '~/composables/useNotify'
import { useProfile } from '~/composables/useProfile'
import { useSession } from '~/composables/useSession'
import type { BuyerProfile } from '~/utils/account'
import { experienceOptions } from '~/utils/account'
import { propertyTypes } from '~/utils/protection'

// Home profile: what you're protecting, who's at home and your experience. Dogs are matched against it
// (Home, your account); the panel beside the form shows what suits you as you choose.
useSeoMeta({ title: 'Home profile · My Dogeash' })

const { user } = useSession()
const { save } = useProfile()
const notify = useNotify()

const form = reactive<Partial<BuyerProfile>>({
  property: user.value?.home?.property,
  city: user.value?.home?.city || user.value?.city || '',
  children: user.value?.home?.children ?? false,
  otherPets: user.value?.home?.otherPets ?? false,
  experience: user.value?.home?.experience,
})
const busy = ref(false)
const error = ref('')
watch(form, () => { error.value = '' })

const missing = computed(() => [
  !form.property && 'what you\'re protecting',
  !form.city?.trim() && 'your city',
  !form.experience && 'your experience',
].filter(Boolean))

async function submit() {
  if (missing.value.length) return (error.value = `Choose ${missing.value.join(', ')}.`)
  busy.value = true
  error.value = (await save({
    property: form.property,
    city: form.city!.trim(),
    has_children: form.children,
    has_other_pets: form.otherPets,
    experience: form.experience,
  })) ?? ''
  busy.value = false
  if (!error.value) notify.success({ kicker: 'Home profile', meta: 'Saved', title: 'Your matches are updated', text: 'Home and your account now show dogs that fit your home.' })
}

const yesNo = [{ value: true, label: 'Yes' }, { value: false, label: 'No' }]
const legend = 'mb-2.5 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded'
const choice = 'flex cursor-pointer items-start gap-3 rounded-lg border-[1.5px] p-3.5 text-left transition-colors'
</script>

<template>
  <div class="flex flex-col gap-6">
    <AccountHeading kicker="Home profile · used for matching" title="Your" outline="home" text="Tell us what the dog will protect. We match dogs to it, and stores see it when you book a visit, so they can suggest the right dog." />

    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <form class="flex flex-col gap-7 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6" novalidate @submit.prevent="submit">
        <fieldset class="m-0 border-0 p-0">
          <legend :class="legend">What are you protecting?</legend>
          <div class="grid grid-cols-2 gap-2.5">
            <button
              v-for="p in propertyTypes"
              :key="p.value"
              type="button"
              :aria-pressed="form.property === p.value"
              :class="[choice, form.property === p.value ? 'border-ink bg-ink text-canvas' : 'border-line-strong bg-transparent text-ink hover:border-ink']"
              @click="form.property = p.value"
            >
              <AppIcon :name="p.value" :size="22" class="mt-0.5 shrink-0" />
              <span class="flex flex-col gap-0.5">
                <strong class="text-[15px] leading-5">{{ p.label }}</strong>
                <span class="font-mono text-[11px] opacity-75">{{ p.hint }}</span>
              </span>
            </button>
          </div>
        </fieldset>

        <div class="flex flex-col gap-2">
          <label for="home-city" :class="legend" class="mb-0">City</label>
          <Input id="home-city" v-model="form.city" placeholder="Abuja" autocomplete="address-level2" class="h-11 border-line-strong" />
          <span class="text-[13px] text-ink-muted">Dogs from stores in your city come first.</span>
        </div>

        <fieldset class="m-0 grid gap-5 border-0 p-0 sm:grid-cols-2">
          <legend :class="legend">Who's at home?</legend>
          <div v-for="q in [{ key: 'children' as const, label: 'Children' }, { key: 'otherPets' as const, label: 'Other pets' }]" :key="q.key" class="flex flex-col gap-2">
            <span class="text-sm font-semibold">{{ q.label }}</span>
            <div class="flex gap-2" role="radiogroup" :aria-label="q.label">
              <button
                v-for="o in yesNo"
                :key="o.label"
                type="button"
                role="radio"
                :aria-checked="form[q.key] === o.value"
                :class="['h-10 flex-1 cursor-pointer rounded-full border-[1.5px] text-sm font-semibold', form[q.key] === o.value ? 'border-ink bg-ink text-canvas' : 'border-line-strong bg-transparent text-ink hover:border-ink']"
                @click="form[q.key] = o.value"
              >{{ o.label }}</button>
            </div>
          </div>
        </fieldset>

        <fieldset class="m-0 border-0 p-0">
          <legend :class="legend">Your experience with guard dogs</legend>
          <div class="flex flex-col gap-2" role="radiogroup" aria-label="Your experience with guard dogs">
            <button
              v-for="o in experienceOptions"
              :key="o.value"
              type="button"
              role="radio"
              :aria-checked="form.experience === o.value"
              :class="[choice, form.experience === o.value ? 'border-ink bg-surface-sunk' : 'border-line-strong bg-transparent hover:border-ink']"
              @click="form.experience = o.value"
            >
              <span :class="['mt-0.5 grid size-5 shrink-0 place-items-center rounded-full', form.experience === o.value ? 'bg-ink text-canvas' : 'ring-[1.5px] ring-line-strong ring-inset']">
                <Check v-if="form.experience === o.value" class="size-3" aria-hidden="true" />
              </span>
              <span class="flex flex-col gap-0.5 text-ink">
                <strong class="text-[15px] leading-5">{{ o.label }}</strong>
                <span class="text-[13px] leading-[19px] text-ink-muted">{{ o.hint }}</span>
              </span>
            </button>
          </div>
        </fieldset>

        <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
        <Button type="submit" variant="marigold" class="h-11 w-full sm:w-fit sm:px-8" :loading="busy">Save home profile</Button>
      </form>

      <AccountHomeMatch :profile="form" />
    </div>
  </div>
</template>
