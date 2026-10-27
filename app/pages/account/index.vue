<script setup lang="ts">
// Account overview: activity tiles, then your dogs, what's coming up, shortlist changes, readiness and home profile
const { user } = useSession()
useSeoMeta({ title: 'My Dogeash · Dogeash' })
</script>

<template>
  <div class="flex flex-col gap-6">
    <AccountHeading :kicker="`Overview · Member since ${user?.memberSince}`" title="My" outline="Dogeash" />
    <AccountGlance />
    <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 xl:grid-cols-2">
      <AccountMyDogs />
      <AccountComingUp />
      <AccountShortlistChanges />
      <div class="flex flex-col gap-4 sm:gap-5">
        <AccountReadiness />
        <AccountHomeProfile />
      </div>
    </div>
  </div>
</template>
