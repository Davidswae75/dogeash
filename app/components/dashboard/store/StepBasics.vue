<script setup lang="ts">
import { storeFormFields } from '~/utils/storeForm'

// Profile step: the store's name, tagline and where it is
</script>

<template>
  <div class="flex flex-col gap-5">
    <Fields :fields="storeFormFields.store" />
    <div class="grid gap-5 sm:grid-cols-2">
      <Fields :fields="storeFormFields.place.slice(0, 2)" />
      <Fields :fields="storeFormFields.place.slice(2)" />
    </div>
  </div>
</template>
