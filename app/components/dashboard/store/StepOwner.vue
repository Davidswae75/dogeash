<script setup lang="ts">
import { useField } from 'vee-validate'
import { storeFormFields } from '~/utils/storeForm'

// Profile step: who runs the kennel, their background and credentials
const { value: bio, errorMessage: bioError } = useField<string>('ownerBio')
const { value: credentials, errorMessage: credentialsError } = useField<string[]>('credentials')
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="grid gap-5 sm:grid-cols-2">
      <Fields :fields="storeFormFields.owner.slice(0, 2)" />
      <Fields :fields="storeFormFields.owner.slice(2)" />
    </div>
    <FieldShell label="Short bio" for="store-owner-bio" hint="Their background with working dogs, in two or three sentences." :error="bioError">
      <Textarea id="store-owner-bio" v-model="bio" rows="4" maxlength="600" class="border-2 border-line-strong" />
    </FieldShell>
    <FieldShell label="Credentials" hint="Up to 6, like &quot;IGP helper certified&quot;. Press Enter after each." :error="credentialsError">
      <TagsInput v-model="credentials" :max="6" class="min-h-12 border-2 border-line-strong">
        <TagsInputItem v-for="c in credentials" :key="c" :value="c">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput placeholder="Add a credential" />
      </TagsInput>
    </FieldShell>
  </div>
</template>
