<script setup lang="ts">
// Dark Home hero, in both themes. The #media slot (photo or animation) fades into the content:
// above it on phones and tablets, beside it on wide screens.
</script>

<template>
  <section class="relative isolate flex overflow-hidden rounded-xl bg-night text-on-night">
    <div class="absolute inset-x-0 top-0 -z-10 h-64 overflow-hidden sm:h-80 lg:inset-y-0 lg:right-0 lg:left-auto lg:h-auto lg:w-[56%]">
      <slot name="media" />
      <div class="absolute inset-0 bg-linear-to-t from-night to-transparent to-30% lg:bg-linear-to-r" aria-hidden="true" />
    </div>
    <div class="flex w-full min-w-0 animate-rise flex-col gap-5 px-5 pt-56 pb-7 sm:px-9 sm:pt-72 sm:pb-10 lg:max-w-[54%] lg:py-14">
      <slot />
    </div>
    <slot name="corner" />
  </section>
</template>
