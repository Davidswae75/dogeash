<script setup lang="ts">
import { ImagePlus, Trash2 } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref } from 'vue'
import { z } from 'zod'
import type { DogDraft } from '~/composables/useOwnedDogs'
import { useOwnedDogs } from '~/composables/useOwnedDogs'
import type { OwnedDog } from '~/utils/myDogs'
import { breeds } from '~/utils/k9'
import type { ProtectionLevel } from '~/utils/protection'
import { protectionLevels } from '~/utils/protection'

// Add a dog you own, or change one: a photo, who it is, and where it came from.
// Only the name is required; the rest fills in the record's facts when known.
// `save` gets the draft and returns an error, or null when it worked.
const props = defineProps<{ dog?: OwnedDog, submitLabel: string, save: (d: DogDraft) => Promise<string | null> }>()

const todayIso = new Date().toISOString().slice(0, 10)
const schema = z.object({
  name: z.string().trim().min(1, 'What\'s the dog called?').max(40),
  breed: z.string().max(60).default(''),
  sex: z.enum(['Male', 'Female', '']).default(''),
  bornOn: z.string().refine(v => !v || v <= todayIso, 'That date is in the future').default(''),
  weightKg: z.union([z.literal(''), z.coerce.number({ message: 'Weight in kg, like 42' }).min(1, 'At least 1 kg').max(120, 'Up to 120 kg')]).default(''),
  microchip: z.string().trim().max(30, 'Up to 30 characters').default(''),
  level: z.string().default(''),
  cameFrom: z.string().trim().max(80).default(''),
  gotOn: z.string().refine(v => !v || v <= todayIso, 'That date is in the future').default(''),
  notes: z.string().trim().max(1000).default(''),
})
  // A dog can't have come to you before it was born (the database checks the same)
  .refine(v => !v.gotOn || !v.bornOn || v.gotOn >= v.bornOn, { message: 'Can\'t be before the dog was born', path: ['gotOn'] })
type Values = z.infer<typeof schema>
const d = props.dog
const { handleSubmit, defineField, errors } = useForm<Values>({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    name: d?.name ?? '',
    breed: d?.breed ?? '',
    sex: d?.sex ?? '',
    bornOn: d?.bornOn ?? '',
    weightKg: d?.weightKg ?? '',
    microchip: d?.microchip ?? '',
    level: d?.level ? String(d.level) : '',
    cameFrom: d?.cameFrom ?? '',
    gotOn: d?.gotOn ?? '',
    notes: d?.notes ?? '',
  },
})
const [name] = defineField('name')
const [breed] = defineField('breed')
const [sex] = defineField('sex')
const [bornOn] = defineField('bornOn')
const [weightKg] = defineField('weightKg')
const [microchip] = defineField('microchip')
const [level] = defineField('level')
const [cameFrom] = defineField('cameFrom')
const [gotOn] = defineField('gotOn')
const [notes] = defineField('notes')

// A breed not in the list (an older entry) stays choosable
const breedOptions = computed(() => [...new Set([...(breed.value ? [breed.value] : []), ...breeds])].map(b => ({ value: b, label: b })))
const levelOptions = ([1, 2, 3, 4, 5] as const).map(n => ({ value: String(n), label: `Level ${n} · ${protectionLevels[n].name}` }))
const sexModel = computed({ get: () => sex.value ?? '', set: (v: string) => { sex.value = (v || '') as Values['sex'] } })

// The photo uploads as soon as it's picked, so saving is quick
const owned = useOwnedDogs()
const photoPath = ref<string | null>(d?.photoPath ?? null)
const photoPreview = ref<string | undefined>(d?.photo)
const photoBusy = ref(false)
const photoError = ref('')
const fileInput = ref<HTMLInputElement>()
async function pickPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  photoBusy.value = true
  photoError.value = ''
  const result = await owned.uploadPhoto(file)
  photoBusy.value = false
  if (result.error) return (photoError.value = result.error)
  photoPath.value = result.path!
  photoPreview.value = URL.createObjectURL(file)
}
function clearPhoto() {
  photoPath.value = null
  photoPreview.value = undefined
}

const busy = ref(false)
const error = ref('')
const submit = handleSubmit(async (v) => {
  busy.value = true
  error.value = (await props.save({
    name: v.name,
    breed: v.breed,
    sex: v.sex || null,
    bornOn: v.bornOn || null,
    weightKg: v.weightKg === '' ? null : Number(v.weightKg),
    microchip: v.microchip,
    level: v.level ? (Number(v.level) as ProtectionLevel) : null,
    photoPath: photoPath.value,
    cameFrom: v.cameFrom,
    gotOn: v.gotOn || null,
    notes: v.notes,
  })) ?? ''
  busy.value = false
})
const field = 'h-11 border-line-strong bg-surface'
</script>

<template>
  <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
    <!-- Photo -->
    <section class="grid gap-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:p-5">
      <AccountDogPortrait :name="name || '?'" :photo="photoPreview" class="aspect-square w-full max-w-[180px]" />
      <div class="flex flex-col gap-2">
        <strong class="text-[15px]">A photo<OptionalTag /></strong>
        <span class="text-[13px] text-ink-muted">Only you can see it. JPG, PNG or WebP, up to 5 MB.</span>
        <div class="mt-1 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" :loading="photoBusy" @click="fileInput?.click()"><ImagePlus aria-hidden="true" />{{ photoPreview ? 'Change photo' : 'Add a photo' }}</Button>
          <Button v-if="photoPreview" type="button" variant="ghost" size="sm" @click="clearPhoto"><Trash2 aria-hidden="true" />Remove</Button>
        </div>
        <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" aria-label="Choose a photo" @change="pickPhoto">
        <p v-if="photoError" class="m-0 text-sm font-semibold text-danger" role="alert">{{ photoError }}</p>
      </div>
    </section>

    <!-- Who it is -->
    <section class="flex flex-col gap-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
      <h2 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Who it is</h2>
      <div class="grid gap-5 sm:grid-cols-2">
        <FieldShell label="Name" for="dog-name" :error="errors.name">
          <Input id="dog-name" v-model="name" maxlength="40" placeholder="Bruno" :class="field" />
        </FieldShell>
        <FieldShell label="Breed" for="dog-breed" optional>
          <SelectMenu id="dog-breed" v-model="breed" :options="breedOptions" placeholder="Choose a breed" class="h-11!" />
        </FieldShell>
        <FieldShell label="Sex" optional>
          <ToggleGroup v-model="sexModel" type="single" variant="outline" aria-label="Sex" class="w-fit">
            <ToggleGroupItem value="Male" class="h-11 px-4">Male</ToggleGroupItem>
            <ToggleGroupItem value="Female" class="h-11 px-4">Female</ToggleGroupItem>
          </ToggleGroup>
        </FieldShell>
        <FieldShell label="Born" for="dog-born" optional hint="Roughly is fine: the first of the month." :error="errors.bornOn">
          <Input id="dog-born" v-model="bornOn" type="date" :max="todayIso" :class="field" />
        </FieldShell>
        <FieldShell label="Weight" for="dog-weight" optional :error="errors.weightKg">
          <InputGroup class="h-11 border-line-strong bg-surface">
            <InputGroupInput id="dog-weight" v-model="weightKg" inputmode="decimal" placeholder="42" />
            <InputGroupAddon align="inline-end">kg</InputGroupAddon>
          </InputGroup>
        </FieldShell>
        <FieldShell label="Microchip number" for="dog-chip" optional hint="On the vet card or the chip certificate." :error="errors.microchip">
          <Input id="dog-chip" v-model="microchip" maxlength="30" placeholder="985 112 004 771 309" :class="[field, 'font-mono']" />
        </FieldShell>
      </div>
      <FieldShell label="Protection level" for="dog-level" optional hint="If it was trained for protection. Leave empty for a family dog.">
        <SelectMenu id="dog-level" v-model="level" :options="levelOptions" placeholder="Not a trained guard dog" class="h-11! sm:w-[360px]" />
      </FieldShell>
    </section>

    <!-- Where it came from -->
    <section class="flex flex-col gap-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
      <h2 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Where it came from</h2>
      <div class="grid gap-5 sm:grid-cols-2">
        <FieldShell label="Kennel, breeder or person" for="dog-from" optional>
          <Input id="dog-from" v-model="cameFrom" maxlength="80" placeholder="K9 Guardian Kennels" :class="field" />
        </FieldShell>
        <FieldShell label="With you since" for="dog-got" optional :error="errors.gotOn">
          <Input id="dog-got" v-model="gotOn" type="date" :min="bornOn || undefined" :max="todayIso" :class="field" />
        </FieldShell>
      </div>
      <FieldShell label="Notes" for="dog-notes" optional hint="Anything a vet, trainer or sitter should know: allergies, temperament, commands.">
        <Textarea id="dog-notes" v-model="notes" rows="3" maxlength="1000" class="border-line-strong bg-surface" />
      </FieldShell>
    </section>

    <p v-if="error" class="m-0 font-semibold text-danger" role="alert">{{ error }}</p>
    <div class="flex flex-wrap gap-3">
      <Button type="submit" variant="marigold" class="h-11" :loading="busy" :disabled="photoBusy">{{ props.submitLabel }}</Button>
      <slot name="actions" />
    </div>
  </form>
</template>
