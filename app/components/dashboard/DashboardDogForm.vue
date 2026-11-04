<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref } from 'vue'
import type { DogMedia, StoreDog } from '~/utils/dogs'
import type { DogFormValues } from '~/utils/dogForm'
import { dogFormFields, dogFormFromDog, dogFormSchema, emptyDogForm } from '~/utils/dogForm'
import { breeds, hipGrades } from '~/utils/k9'
import { propertyTypes, protectionLevels } from '~/utils/protection'
import type { ProtectionLevel } from '~/utils/protection'

// Add or edit a dog: basics, protection, health, training, photos and videos, and the listing.
// `save` gets the checked values, the photos and videos, and whether to publish; it returns an error or null.
const props = defineProps<{
  dog?: StoreDog
  city?: string
  verified: boolean
  save: (values: DogFormValues, media: DogMedia, publish: boolean) => Promise<string | null>
}>()

const { handleSubmit, defineField, errors } = useForm<DogFormValues>({
  validationSchema: toTypedSchema(dogFormSchema),
  initialValues: props.dog ? dogFormFromDog(props.dog) : emptyDogForm(props.city),
})
const [breed] = defineField('breed')
const [sex] = defineField('sex')
const [level] = defineField('level')
const [property] = defineField('property')
const [safeWithChildren] = defineField('safeWithChildren')
const [hips] = defineField('hips')
const [summary] = defineField('summary')
const [traits] = defineField('traits')

// The main photo, more photos and videos, as storage paths (uploads happen as they're picked)
const media = ref<DogMedia>(props.dog
  ? { photoPath: props.dog.media.photoPath, gallery: [...props.dog.media.gallery], videos: props.dog.media.videos.map(v => ({ ...v })) }
  : { photoPath: null, gallery: [], videos: [] })
const busy = ref<'draft' | 'publish' | 'save'>()
const error = ref('')

// Keep a breed that isn't in the list (older listings) selectable
const breedOptions = computed(() => (breed.value && !breeds.includes(breed.value as never) ? [breed.value, ...breeds] : [...breeds]))
const levels = ([1, 2, 3, 4, 5] as ProtectionLevel[]).map(n => ({ value: n, label: `${n} · ${protectionLevels[n].name}` }))
const isLive = computed(() => props.dog && ['available', 'reserved'].includes(props.dog.status))

function submit(mode: 'draft' | 'publish' | 'save') {
  return handleSubmit(async (values) => {
    if (mode === 'publish' && !media.value.photoPath) return (error.value = 'Add a main photo before the dog goes live.')
    busy.value = mode
    error.value = (await props.save(values, media.value, mode === 'publish')) ?? ''
    busy.value = undefined
  }, () => { error.value = 'Some fields need a look. They\'re marked in red.' })()
}

const section = 'flex flex-col gap-5 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6'
const heading = 'm-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded'
const chips = 'flex w-auto flex-wrap justify-start gap-2'
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="submit(props.dog ? 'save' : 'draft')">
    <section :class="section" aria-labelledby="dog-basics">
      <h2 id="dog-basics" :class="heading">The dog</h2>
      <DashboardDogPhoto v-model:path="media.photoPath" :preview="props.dog?.photo" />
      <div class="grid gap-5 sm:grid-cols-2">
        <Fields :fields="dogFormFields.basics.slice(0, 1)" />
        <FieldShell label="Breed" for="dog-breed" :error="errors.breed">
          <NativeSelect id="dog-breed" v-model="breed" class="h-12 w-full border-2 border-line-strong">
            <NativeSelectOption value="" disabled>Choose a breed</NativeSelectOption>
            <NativeSelectOption v-for="b in breedOptions" :key="b" :value="b">{{ b }}</NativeSelectOption>
          </NativeSelect>
        </FieldShell>
      </div>
      <FieldShell label="Sex" :error="errors.sex">
        <ToggleGroup v-model="sex" type="single" variant="chip" aria-label="Sex" :class="chips">
          <ToggleGroupItem value="Male" class="rounded-full!">Male</ToggleGroupItem>
          <ToggleGroupItem value="Female" class="rounded-full!">Female</ToggleGroupItem>
        </ToggleGroup>
      </FieldShell>
      <Fields :fields="dogFormFields.basics.slice(1)" class="grid gap-5 sm:grid-cols-2" />
    </section>

    <section :class="section" aria-labelledby="dog-protection">
      <h2 id="dog-protection" :class="heading">Protection and who it suits</h2>
      <FieldShell label="Protection level" hint="Your honest level. The inspector confirms it at the kennel." :error="errors.level">
        <ToggleGroup v-model="level" type="single" variant="chip" aria-label="Protection level" :class="chips">
          <ToggleGroupItem v-for="l in levels" :key="l.value" :value="l.value" class="rounded-full!">{{ l.label }}</ToggleGroupItem>
        </ToggleGroup>
      </FieldShell>
      <FieldShell label="Suits" :error="errors.property">
        <FilterChips v-model="property" :options="propertyTypes.map(p => ({ value: p.value, label: p.label }))" label="Suits" />
      </FieldShell>
      <FieldShell label="Safe with children">
        <ToggleGroup :model-value="safeWithChildren ? 'yes' : 'no'" type="single" variant="chip" aria-label="Safe with children" :class="chips" @update:model-value="v => v && (safeWithChildren = v === 'yes')">
          <ToggleGroupItem value="yes" class="rounded-full!">Yes</ToggleGroupItem>
          <ToggleGroupItem value="no" class="rounded-full!">No</ToggleGroupItem>
        </ToggleGroup>
      </FieldShell>
      <FieldShell label="Traits" hint="Up to 6 short ones, like &quot;Bombproof nerves&quot;. Press Enter after each." :error="errors.traits">
        <TagsInput v-model="traits" :max="6" class="min-h-12 border-2 border-line-strong">
          <TagsInputItem v-for="t in traits" :key="t" :value="t">
            <TagsInputItemText />
            <TagsInputItemDelete />
          </TagsInputItem>
          <TagsInputInput placeholder="Add a trait" />
        </TagsInput>
      </FieldShell>
    </section>

    <section :class="section" aria-labelledby="dog-health">
      <h2 id="dog-health" :class="heading">Health</h2>
      <FieldShell label="Hip grade" for="dog-hips" :error="errors.hips">
        <NativeSelect id="dog-hips" v-model="hips" class="h-12 w-full border-2 border-line-strong sm:w-64">
          <NativeSelectOption v-for="h in hipGrades" :key="h" :value="h">{{ h }}</NativeSelectOption>
        </NativeSelect>
      </FieldShell>
      <Fields :fields="dogFormFields.health" />
    </section>

    <section :class="section" aria-labelledby="dog-training">
      <h2 id="dog-training" :class="heading">Training and pedigree</h2>
      <Fields :fields="dogFormFields.training" />
    </section>

    <section :class="section" aria-labelledby="dog-media">
      <div class="flex flex-col gap-1">
        <h2 id="dog-media" :class="heading">More photos and videos</h2>
        <p class="m-0 text-[13px] leading-5 text-ink-muted">Optional, but they make the listing. They appear in the gallery at the top of the dog's page, after the main photo.</p>
      </div>
      <DashboardDogGallery v-model:paths="media.gallery" />
      <DashboardDogVideos v-model:videos="media.videos" />
    </section>

    <section :class="section" aria-labelledby="dog-listing">
      <h2 id="dog-listing" :class="heading">The listing</h2>
      <FieldShell label="Summary" for="dog-summary" hint="What a buyer should know first: temperament, training, the home it's right for." :error="errors.summary">
        <Textarea id="dog-summary" v-model="summary" rows="4" maxlength="600" class="border-2 border-line-strong" />
      </FieldShell>
      <Fields :fields="dogFormFields.listing" />
    </section>

    <div class="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-1 py-3 backdrop-blur">
      <p v-if="error" class="m-0 w-full text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <template v-if="props.dog">
        <Button type="submit" :loading="busy === 'save'">Save changes</Button>
        <Button v-if="props.verified && !isLive && props.dog.status !== 'sold'" type="button" variant="marigold" :loading="busy === 'publish'" @click="submit('publish')">Save and go live</Button>
      </template>
      <template v-else>
        <Button v-if="props.verified" type="button" variant="marigold" :loading="busy === 'publish'" @click="submit('publish')">Save and go live</Button>
        <Button type="submit" :variant="props.verified ? 'outline' : 'default'" :loading="busy === 'draft'">Save as draft</Button>
      </template>
      <span v-if="!props.verified" class="text-[13px] text-ink-muted">Your dogs go live once your store passes its inspection.</span>
    </div>
  </form>
</template>
