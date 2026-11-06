<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, nextTick, ref } from 'vue'
import type { StoreImage } from '~/composables/useStoreProfile'
import type { Store } from '~/utils/stores'
import type { StoreFormValues } from '~/utils/storeForm'
import { useNotify } from '~/composables/useNotify'
import { storeFormFromStore, storeFormSchema, storeSetupNeeded, storeStepDone, storeStepSchema, storeSteps } from '~/utils/storeForm'

// The store profile in steps.
// Setting up (the essentials not yet filled in): one step after another, from the first unfinished one,
// ending on a review and Finish. Each step is checked and saved when you go forward, so nothing is lost if
// someone stops halfway; going back never blocks.
// Editing (afterwards): open any step, in any order, without anything being checked. Changes are kept
// across steps (each step with unsaved changes is marked) and "Save changes" checks and saves them all;
// if something needs fixing, it opens that step with the fields marked.
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

// Setting up checks one step at a time; editing checks the whole profile, but only on Save
// Values of steps not on screen are kept, so changes survive moving between steps.
const { handleSubmit, meta, resetForm, values, validate } = useForm<StoreFormValues>({
  validationSchema: computed(() => toTypedSchema(setup.value ? storeStepSchema(current.value.key) : storeFormSchema)),
  initialValues: storeFormFromStore(props.store),
  keepValuesOnUnmount: true,
})
// What's saved, to tell which steps hold unsaved changes (editing)
const saved = computed(() => storeFormFromStore(props.store))
// Compared by content: key order doesn't matter, and 2014 equals "2014" (what a typed field gives back)
const plain = (v: unknown): unknown => (Array.isArray(v)
  ? v.map(plain)
  : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, plain((v as Record<string, unknown>)[k])]))
    : String(v ?? '').trim())
const differs = (f: keyof StoreFormValues) => JSON.stringify(plain(values[f])) !== JSON.stringify(plain(saved.value[f]))
const unsaved = (i: number) => !setup.value && storeSteps[i]!.fields.some(f => differs(f))
const unsavedCount = computed(() => storeSteps.filter((_, i) => unsaved(i)).length)
const changed = computed(() => unsavedCount.value > 0)

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

function show(to: number) {
  error.value = ''
  step.value = to
  furthest.value = Math.max(furthest.value, to)
  panel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function go(to: number) {
  if (to === step.value || to < 1 || to > last) return
  // Editing: just open it. Setting up, going back: save if it's ready, never block.
  if (!setup.value) return show(to)
  if (to < step.value) {
    if (meta.value.valid && meta.value.dirty) await saveStep()
    return show(to)
  }
  if (!(await saveStep())) return
  error.value = ''
  step.value = to
  furthest.value = Math.max(furthest.value, to)
  panel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Editing: check and save every change, on every step. If something needs fixing, open that step.
async function saveAll() {
  let ok = false
  await handleSubmit(async (v) => {
    busy.value = true
    error.value = (await props.save({ ...storeFormFromStore(props.store), ...v }, true)) ?? ''
    busy.value = false
    ok = !error.value
  }, ({ errors }) => {
    const wrong = Object.keys(errors)
    const at = storeSteps.findIndex(st => st.fields.some(f => wrong.some(w => w === f || w.startsWith(`${f}[`) || w.startsWith(`${f}.`))))
    if (at >= 0 && at + 1 !== step.value) show(at + 1)
    error.value = at >= 0 ? `Some fields in ${storeSteps[at]!.title} need a look. They're marked in red.` : 'Some fields need a look.'
  })()
  if (!ok) {
    // Once the step with the problem is on screen, check again so its fields are marked in red
    await nextTick()
    await validate()
    return
  }
  await nextTick()
  resetForm({ values: storeFormFromStore(props.store) })
  useNotify().storeUpdated(props.store.name)
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
              <StepperTitle class="flex items-center gap-2 text-sm leading-5 font-bold whitespace-normal">
                {{ s.title }}<span v-if="unsaved(i)" class="size-2 rounded-full bg-marigold" title="Unsaved changes" aria-label="Unsaved changes" />
              </StepperTitle>
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

      <form class="flex flex-col gap-5 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-7" novalidate @submit.prevent="setup ? go(step + 1) : saveAll()">
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
            <Button type="submit" variant="marigold" :loading="busy" :disabled="!changed">Save changes</Button>
            <span class="text-[13px] text-ink-muted">{{ !changed ? 'No changes yet.' : unsavedCount > 1 ? `Unsaved changes in ${unsavedCount} steps` : 'Unsaved changes' }}</span>
            <span class="flex-1" />
            <Button v-if="props.store.verified" as-child variant="outline"><NuxtLink :to="`/stores/${props.store.slug}`">View your store page</NuxtLink></Button>
          </template>
        </footer>
      </form>

      <!-- Phones: jump to any step once editing -->
      <nav v-if="!setup" class="flex flex-wrap gap-2 lg:hidden" aria-label="Profile steps">
        <Button v-for="(s, i) in storeSteps" :key="s.key" type="button" size="sm" :variant="i + 1 === step ? 'default' : 'outline'" @click="go(i + 1)">
          {{ s.title }}<span v-if="unsaved(i)" class="size-1.5 rounded-full bg-marigold" aria-label="Unsaved changes" />
        </Button>
      </nav>
    </div>
  </div>
</template>
