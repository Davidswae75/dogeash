<script setup lang="ts">
// The inside of the logo (AppLogo wraps it in a link or a span). See AppLogo for the three forms.
const props = defineProps<{ variant: 'inline' | 'lockup' | 'word' }>()
// The marigold square after the word: the gate lamp
// Sized in em, so it keeps its proportion at any logo size
const lamp = 'inline-flex items-baseline after:ml-[.12em] after:inline-block after:size-[.37em] after:rounded-[.08em] after:bg-marigold after:content-[\'\']'
</script>

<template>
  <!-- "d", the dog as the "o" (chin on the baseline, ears up like a letter's ascender), "geash" -->
  <span v-if="props.variant === 'inline'" :class="lamp">
    <span class="sr-only">dogeash</span>
    <span aria-hidden="true">d</span><DogMark :weight="4" :detail="2.7" class="mx-[.02em] inline-block size-[1em] shrink-0 translate-y-[.15em]" /><span aria-hidden="true">geash</span>
  </span>
  <template v-else>
    <DogMark v-if="props.variant === 'lockup'" :weight="2.8" class="size-[1.55em] shrink-0" />
    <span :class="lamp">dogeash</span>
  </template>
</template>
