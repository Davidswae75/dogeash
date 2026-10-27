<script setup lang="ts">
// Top of the signed-in Home: who you are, what's waiting, and search. A small patrol chase on wide screens.
const { user, firstName } = useSession()
const { count } = useShortlist()
const next = sampleBookings[0]
const query = ref('')

function search(q: string) {
  navigateTo({ path: '/dogs', query: q ? { q } : undefined })
}
</script>

<template>
  <section class="grid items-center gap-6 rounded-xl bg-surface p-5 sm:p-8 lg:grid-cols-[1fr_250px] lg:gap-10">
    <div class="flex min-w-0 animate-rise flex-col gap-4">
      <span class="font-mono text-[11px] leading-4 font-semibold tracking-[.12em] text-ink-muted uppercase">
        My Dogeash · {{ user?.city }} · {{ user?.id }}
      </span>
      <h1 class="m-0 mega text-[clamp(30px,3.4vw,46px)] leading-[.98]">
        Welcome back, <span class="text-outline">{{ firstName }}.</span>
      </h1>
      <p class="m-0 max-w-[40em] text-[15px] leading-6 text-ink-muted">
        <ClientOnly>
          <strong class="text-ink">{{ count }} {{ count === 1 ? 'dog' : 'dogs' }}</strong> on your shortlist
          <template #fallback>Your shortlist</template>
        </ClientOnly>
        <template v-if="next"> · next visit <strong class="text-ink">{{ next.day }}, {{ next.time }}</strong> at {{ next.with }}</template>.
      </p>
      <SearchBar v-model="query" class="max-w-[560px]" @search="search" />
    </div>
    <div class="hidden animate-rise [animation-delay:80ms] lg:block">
      <PatrolMap variant="night" />
    </div>
  </section>
</template>
