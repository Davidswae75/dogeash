<script setup lang="ts">
// Floats at the bottom of the shortlist once dogs are picked to compare
const { compareDogs, toggleCompare } = useShortlist()
const ready = computed(() => compareDogs.value.length >= 2)
</script>

<template>
  <Transition enter-active-class="transition duration-300 ease-calm" enter-from-class="translate-y-full opacity-0" leave-active-class="transition duration-200" leave-to-class="translate-y-full opacity-0">
    <div v-if="compareDogs.length" class="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(16px,env(safe-area-inset-bottom,0px))] sm:px-8">
      <div class="mx-auto flex max-w-[760px] flex-wrap items-center gap-4 rounded-xl bg-night p-3.5 text-on-night shadow-[0_18px_40px_-16px_rgba(0,0,0,.6)] sm:flex-nowrap sm:p-4">
        <div class="flex -space-x-2">
          <img v-for="dog in compareDogs" :key="dog.fileNo" :src="dog.photo" :alt="dog.name" class="size-10 rounded-full border-2 border-night object-cover">
        </div>
        <div class="min-w-0 flex-1 text-sm">
          <strong class="block">{{ compareDogs.map(d => d.name).join(' vs ') }}</strong>
          <span class="text-on-night/70">{{ ready ? `Ready to compare ${compareDogs.length} dogs` : 'Pick one more dog to compare' }} · up to {{ COMPARE_MAX }}</span>
        </div>
        <Button variant="ghost" size="sm" class="text-on-night hover:bg-on-night/10" @click="compareDogs.forEach(d => toggleCompare(d.fileNo))">Clear</Button>
        <Button v-if="ready" as-child variant="marigold" size="sm">
          <NuxtLink to="/shortlist/compare">Compare {{ compareDogs.length }} dogs</NuxtLink>
        </Button>
        <Button v-else variant="marigold" size="sm" disabled>Compare</Button>
      </div>
    </div>
  </Transition>
</template>
