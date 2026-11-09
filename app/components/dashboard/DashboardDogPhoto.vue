<script setup lang="ts">
import { useStoreDogs } from '~/composables/useStoreDogs'

// The dog's main photo, uploaded to the store's folder (the shared PhotoPicker); the form saves its path
const props = defineProps<{ preview?: string }>()
const path = defineModel<string | null>('path', { default: null })
const { uploadPhoto } = useStoreDogs()
</script>

<template>
  <PhotoPicker
    v-model:path="path"
    :upload="uploadPhoto"
    :preview="props.preview"
    label="Main photo"
    hint="A clear side-on photo in daylight. JPG, PNG or WebP, up to 5 MB."
    note="Needed before the dog can go live."
  />
</template>
