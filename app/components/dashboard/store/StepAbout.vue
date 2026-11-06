<script setup lang="ts">
import { useField } from 'vee-validate'
import type { StoreService } from '~/utils/stores'
import { storeFormFields } from '~/utils/storeForm'
import { storeServices } from '~/utils/stores'

// Profile step: the about text, what the store offers, hours and delivery
const { value: about, errorMessage: aboutError } = useField<string>('about')
const { value: services, errorMessage: servicesError } = useField<StoreService[]>('services')
</script>

<template>
  <div class="flex flex-col gap-5">
    <FieldShell label="About" for="store-about-text" hint="What buyers should know: your land, your dogs' lines, how you train, what handover includes. At least a few sentences." :error="aboutError">
      <Textarea id="store-about-text" v-model="about" rows="6" maxlength="1200" class="border-2 border-line-strong" />
    </FieldShell>
    <FieldShell label="What you offer" optional hint="Shown as badges on your store page." :error="servicesError">
      <ToggleGroup v-model="services" type="multiple" variant="chip" aria-label="What you offer" class="flex w-auto flex-wrap justify-start gap-2">
        <ToggleGroupItem v-for="(s, key) in storeServices" :key="key" :value="key" :title="s.hint" class="rounded-full!">{{ s.label }}</ToggleGroupItem>
      </ToggleGroup>
    </FieldShell>
    <Fields :fields="storeFormFields.visiting" />
  </div>
</template>
