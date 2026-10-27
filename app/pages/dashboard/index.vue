<script setup lang="ts">
// Store dashboard overview. Main column: what needs doing, then the dogs.
// Side column: what's coming up, then how the store looks to buyers. Each section is its own component.
definePageMeta({ layout: 'dashboard', title: 'Overview', middleware: 'store-member' })
useSeoMeta({ title: 'Overview · Store dashboard · Dogeash', robots: 'noindex' })
</script>

<template>
  <div class="flex flex-col gap-6">
    <DashboardGreeting />
    <DashboardStats />
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div class="flex min-w-0 flex-col gap-5">
        <DashboardAttention />
        <DashboardDogs />
      </div>
      <div class="flex min-w-0 flex-col gap-5">
        <DashboardAgenda />
        <DashboardStoreHealth />
      </div>
    </div>
  </div>
</template>
