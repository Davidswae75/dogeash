<script setup lang="ts">
import { Plus, X } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useFieldArray, useForm } from 'vee-validate'
import { ref } from 'vue'
import type { Store } from '~/utils/stores'
import type { StoreFormValues } from '~/utils/storeForm'
import { storeFormFields, storeFormFromStore, storeFormSchema } from '~/utils/storeForm'
import { storeServices } from '~/utils/stores'

// The store profile: name and place, about and services, who runs it, and its history.
// `save` gets the checked values and returns an error or null.
const props = defineProps<{ store: Store, save: (values: StoreFormValues) => Promise<string | null> }>()

const { handleSubmit, defineField, errors, meta, resetForm } = useForm<StoreFormValues>({
  validationSchema: toTypedSchema(storeFormSchema),
  initialValues: storeFormFromStore(props.store),
})
const [about] = defineField('about')
const [services] = defineField('services')
const [ownerBio] = defineField('ownerBio')
const [credentials] = defineField('credentials')
const { fields: history, push, remove } = useFieldArray<{ year: number, text: string }>('history')

const busy = ref(false)
const error = ref('')

const submit = handleSubmit(async (values) => {
  busy.value = true
  error.value = (await props.save(values)) ?? ''
  busy.value = false
  if (!error.value) resetForm({ values })
}, () => { error.value = 'Some fields need a look. They\'re marked in red.' })

const rowError = (i: number) => (errors.value as Record<string, string | undefined>)[`history[${i}].year`] ?? (errors.value as Record<string, string | undefined>)[`history[${i}].text`]

const section = 'flex flex-col gap-5 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6'
const heading = 'm-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded'
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
    <section :class="section" aria-labelledby="store-basics">
      <h2 id="store-basics" :class="heading">Your store</h2>
      <Fields :fields="storeFormFields.store" />
      <div class="grid gap-5 sm:grid-cols-2">
        <Fields :fields="storeFormFields.place.slice(0, 2)" />
        <Fields :fields="storeFormFields.place.slice(2)" />
      </div>
    </section>

    <section :class="section" aria-labelledby="store-about">
      <h2 id="store-about" :class="heading">About the kennel</h2>
      <FieldShell label="About" for="store-about-text" hint="What buyers should know: your land, your dogs' lines, how you train, what handover includes." :error="errors.about">
        <Textarea id="store-about-text" v-model="about" rows="5" maxlength="1200" class="border-2 border-line-strong" />
      </FieldShell>
      <FieldShell label="What you offer" hint="Shown as badges on your store page." :error="errors.services">
        <ToggleGroup v-model="services" type="multiple" variant="chip" aria-label="What you offer" class="flex w-auto flex-wrap justify-start gap-2">
          <ToggleGroupItem v-for="(s, key) in storeServices" :key="key" :value="key" :title="s.hint" class="rounded-full!">{{ s.label }}</ToggleGroupItem>
        </ToggleGroup>
      </FieldShell>
      <Fields :fields="storeFormFields.visiting" />
    </section>

    <section :class="section" aria-labelledby="store-owner">
      <h2 id="store-owner" :class="heading">Who runs it</h2>
      <div class="grid gap-5 sm:grid-cols-2">
        <Fields :fields="storeFormFields.owner.slice(0, 2)" />
        <Fields :fields="storeFormFields.owner.slice(2)" />
      </div>
      <FieldShell label="Short bio" for="store-owner-bio" hint="Their background with working dogs, in two or three sentences." :error="errors.ownerBio">
        <Textarea id="store-owner-bio" v-model="ownerBio" rows="3" maxlength="600" class="border-2 border-line-strong" />
      </FieldShell>
      <FieldShell label="Credentials" hint="Up to 6, like &quot;IGP helper certified&quot;. Press Enter after each." :error="errors.credentials">
        <TagsInput v-model="credentials" :max="6" class="min-h-12 border-2 border-line-strong">
          <TagsInputItem v-for="c in credentials" :key="c" :value="c">
            <TagsInputItemText />
            <TagsInputItemDelete />
          </TagsInputItem>
          <TagsInputInput placeholder="Add a credential" />
        </TagsInput>
      </FieldShell>
    </section>

    <section :class="section" aria-labelledby="store-history">
      <div class="flex flex-col gap-1">
        <h2 id="store-history" :class="heading">History</h2>
        <p class="m-0 text-[13px] leading-5 text-ink-muted">Moments buyers see as a timeline: when you started, your first titled dog, new lines, new facilities. Shown oldest first.</p>
      </div>
      <ol v-if="history.length" class="m-0 flex list-none flex-col gap-3 p-0">
        <li v-for="(row, i) in history" :key="row.key" class="flex flex-col gap-1.5">
          <div class="flex items-start gap-2">
            <Input v-model="row.value.year" inputmode="numeric" maxlength="4" :aria-label="`Year of moment ${i + 1}`" placeholder="2014" class="h-11 w-[5.5rem] shrink-0 border-2 border-line-strong font-mono" />
            <Input v-model="row.value.text" maxlength="160" :aria-label="`What happened, moment ${i + 1}`" placeholder="Founded in Kuje with two imported German Shepherd females" class="h-11 flex-1 border-2 border-line-strong" />
            <Button type="button" variant="ghost" size="icon" :aria-label="`Remove moment ${i + 1}`" @click="remove(i)"><X aria-hidden="true" /></Button>
          </div>
          <p v-if="rowError(i)" class="m-0 text-[13px] font-semibold text-danger">{{ rowError(i) }}</p>
        </li>
      </ol>
      <Button v-if="history.length < 12" type="button" variant="outline" size="sm" class="w-fit" @click="push({ year: new Date().getFullYear(), text: '' })">
        <Plus aria-hidden="true" />Add a moment
      </Button>
    </section>

    <div class="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-1 py-3 backdrop-blur">
      <p v-if="error" class="m-0 w-full text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <Button type="submit" variant="marigold" :loading="busy" :disabled="!meta.dirty">Save changes</Button>
      <Button v-if="props.store.verified" as-child variant="outline"><NuxtLink :to="`/stores/${props.store.slug}`">View your store page</NuxtLink></Button>
      <span v-if="!meta.dirty" class="text-[13px] text-ink-muted">No changes yet.</span>
    </div>
  </form>
</template>
