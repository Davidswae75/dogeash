<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, nextTick, ref } from 'vue'
import type { StoreImage } from '~/composables/useStoreProfile'
import type { Store } from '~/utils/stores'
import type { StoreFormValues } from '~/utils/storeForm'
import { useNotify } from '~/composables/useNotify'
import { storeFormFromStore, storeSetupNeeded, storeStepDone, storeStepSchema, storeSteps } from '~/utils/storeForm'

// The store profile in steps. Each step is checked on its own and saved when you leave it (Next, Back or
// another step), so nothing is lost if someone stops halfway.
// Setting up (the essentials not yet filled in): one step after another, from the first unfinished one,
// ending on a review and Finish. Editing (afterwards): any step, in any order, saved on its own.
const props = defineProps<{
  store: Store
  save: (values: StoreFormValues, quiet?: boolean) => Promise<string | null>
  setImage: (kind: StoreImage, file: File | null) => Promise<string | null>
}>()

const setup = ref(storeSetupNeeded(props.store))
const firstUnfinished = storeSteps.findIndex(s => !s.optional && s.key !== 'review' && !storeStepDone(props.store, s.key)) + 1
const step = ref(setup.value ? Math.max(firstUnfinished, 1) : 1)
const furthest = ref(step.value)
const current = computed(() => storeSteps[step.value - 1]!)
const last = storeSteps.length

const { handleSubmit, meta, resetForm } = useForm<StoreFormValues>({
  validationSchema: computed(() => toTypedSchema(storeStepSchema(current.value.key))),
  initialValues: storeFormFromStore(props.store),
})

const busy = ref(false)
const error = ref('')
const panel = ref<HTMLElement>()

// Save this step if it changed (or, while setting up, if it still needs filling in). True when it's fine to move on.
async function saveStep(): Promise<boolean> {
  const { key, fields, optional } = current.value
  if (!fields.length) return true
  if (!meta.value.dirty && (optional || !setup.value || storeStepDone(props.store, key))) return true
  let saved = false
  await handleSubmit(async (values) => {
    busy.value = true
    error.value = (await props.save({ ...storeFormFromStore(props.store), ...values }, true)) ?? ''
    busy.value = false
    saved = !error.value
  }, () => { error.value = 'Some fields need a look. They\'re marked in red.' })()
  if (saved) {
    await nextTick()
    resetForm({ values: storeFormFromStore(props.store) })
  }
  return saved
}

async function go(to: number) {
  if (to === step.value || to < 1 || to > last) return
  if (!(await saveStep())) return
  error.value = ''
  step.value = to
  furthest.value = Math.max(furthest.value, to)
  panel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Edit mode: save the open step and stay on it
async function saveHere() {
  if (await saveStep()) useNotify().storeUpdated(props.store.name)
}

function finish() {
  setup.value = false
  useNotify().storeUpdated(props.store.name, 'Your store profile is ready')
}

const progress = computed(() => Math.round(((step.value - 1) / (last - 1)) * 100))
</script>

<template>
  <div class="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
    <!-- Steps: a list beside the form on wide screens -->
    <aside class="hidden lg:block">
      <Stepper :model-value="step" orientation="vertical" :linear="false" class="sticky top-24 flex-col items-stretch gap-0" @update:model-value="v => v && go(v)">
        <StepperItem
          v-for="(s, i) in storeSteps"
          :key="s.key"
          :step="i + 1"
          :completed="i + 1 !== step && (storeStepDone(props.store, s.key) || (s.optional && i + 1 < furthest))"
          :disabled="setup && i + 1 > furthest"
          class="relative items-start gap-3 pb-6 last:pb-0"
        >
          <StepperSeparator v-if="i < storeSteps.length - 1" class="absolute top-9 bottom-1 left-[15px] w-0.5 rounded-full bg-line group-data-[state=completed]:bg-marigold" />
          <StepperTrigger class="flex-row items-start gap-3 p-0 text-left">
            <StepperIndicator class="size-8 shrink-0 bg-surface-sunk font-mono text-xs font-bold text-ink-muted ring-1 ring-line group-data-[state=active]:bg-ink group-data-[state=active]:text-canvas group-data-[state=completed]:bg-marigold group-data-[state=completed]:text-on-marigold">
              <Check v-if="i + 1 !== step && storeStepDone(props.store, s.key)" class="size-4" aria-hidden="true" />
              <span v-else>{{ i + 1 }}</span>
            </StepperIndicator>
            <span class="flex flex-col pt-1">
              <StepperTitle class="text-sm leading-5 font-bold whitespace-normal">{{ s.title }}</StepperTitle>
              <span class="text-xs leading-[18px] text-ink-muted">{{ s.optional ? `Optional · ${s.hint}` : s.hint }}</span>
            </span>
          </StepperTrigger>
        </StepperItem>
      </Stepper>
    </aside>

    <div ref="panel" class="flex scroll-mt-24 flex-col gap-4">
      <!-- Phones: where you are, and a bar -->
      <div class="flex flex-col gap-2 lg:hidden">
        <span class="font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">Step {{ step }} of {{ last }}</span>
        <div class="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" aria-label="Profile steps">
          <div class="h-full rounded-full bg-marigold transition-[width]" :style="{ width: `${progress}%` }" />
        </div>
      </div>

      <form class="flex flex-col gap-5 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-7" novalidate @submit.prevent="setup ? go(step + 1) : saveHere()">
        <header class="flex flex-col gap-1.5">
          <span class="hidden font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase lg:block">Step {{ step }} of {{ last }}{{ current.optional ? ' · optional' : '' }}</span>
          <h2 class="m-0 font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">{{ current.title }}</h2>
          <p class="m-0 max-w-[40em] text-sm leading-[21px] text-ink-muted">{{ current.why }}</p>
        </header>

        <DashboardStoreStepBasics v-if="current.key === 'store'" />
        <DashboardStoreStepAbout v-else-if="current.key === 'about'" />
        <DashboardStoreStepOwner v-else-if="current.key === 'owner'" />
        <DashboardStoreStepHistory v-else-if="current.key === 'history'" />
        <DashboardStoreImages v-else-if="current.key === 'images'" :store="props.store" :set="props.setImage" bare />
        <DashboardStoreStepReview v-else :store="props.store" @edit="go" />

        <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>

        <!-- Setting up: back and forward. Editing: save this step. -->
        <footer class="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <template v-if="setup">
            <Button v-if="step > 1" type="button" variant="ghost" :disabled="busy" @click="go(step - 1)"><ArrowLeft aria-hidden="true" />Back</Button>
            <span class="flex-1" />
            <Button v-if="current.optional && !meta.dirty" type="button" variant="ghost" :disabled="busy" @click="go(step + 1)">Skip for now</Button>
            <Button v-if="step < last" type="submit" variant="marigold" :loading="busy">
              {{ meta.dirty ? 'Save and continue' : 'Continue' }}<ArrowRight aria-hidden="true" />
            </Button>
            <Button v-else type="button" variant="marigold" @click="finish"><Check aria-hidden="true" />Finish</Button>
          </template>
          <template v-else>
            <Button v-if="current.fields.length" type="submit" variant="marigold" :loading="busy" :disabled="!meta.dirty">Save changes</Button>
            <span v-if="current.fields.length && !meta.dirty" class="text-[13px] text-ink-muted">No changes yet.</span>
            <span class="flex-1" />
            <Button v-if="props.store.verified" as-child variant="outline"><NuxtLink :to="`/stores/${props.store.slug}`">View your store page</NuxtLink></Button>
          </template>
        </footer>
      </form>

      <!-- Phones: jump to any step once editing -->
      <nav v-if="!setup" class="flex flex-wrap gap-2 lg:hidden" aria-label="Profile steps">
        <Button v-for="(s, i) in storeSteps" :key="s.key" type="button" size="sm" :variant="i + 1 === step ? 'default' : 'outline'" @click="go(i + 1)">{{ s.title }}</Button>
      </nav>
    </div>
  </div>
</template>
