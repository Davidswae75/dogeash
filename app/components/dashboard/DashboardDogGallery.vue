<script setup lang="ts">
import { useRuntimeConfig } from '#imports' // nuxt
import { useStoreDogs } from '~/composables/useStoreDogs'
import { DOG_GALLERY_MAX, dogPhotoUrl } from '~/utils/dogs'

// More photos after the main one, up to 8, uploaded to the store's folder (the shared PhotoGrid)
const paths = defineModel<string[]>('paths', { default: () => [] })
const { uploadPhoto } = useStoreDogs()
const storageUrl = useRuntimeConfig().public.supabase.url as string
</script>

<template>
  <PhotoGrid
    v-model:paths="paths"
    :upload="uploadPhoto"
    :url-of="p => dogPhotoUrl(p, storageUrl)"
    :max="DOG_GALLERY_MAX"
    label="More photos"
    optional
    hint="Different angles, at work, with people, the kennel. JPG, PNG or WebP, up to 5 MB each. You can pick several at once."
  />
</template>
