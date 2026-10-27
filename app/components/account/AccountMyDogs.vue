<script setup lang="ts">
// Overview panel: each dog you own and the most urgent thing it needs
const dogs = sampleOwnedDogs
</script>

<template>
  <SectionPanel title="My dogs" :meta="`${dogs.length} at home`" see-all="/account/dogs" see-all-label="All records">
    <ul v-if="dogs.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="dog in dogs" :key="dog.fileNo">
        <NuxtLink :to="ownedDogLink(dog)" class="flex items-center gap-4 rounded-lg p-3 text-ink no-underline hover:bg-surface-sunk">
          <AccountDogPortrait :name="dog.name" :photo="dog.photo" compact class="size-14 rounded-md" />
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong class="text-[15px] leading-5">{{ dog.name }}</strong>
            <span class="truncate text-[13px] text-ink-muted">{{ dog.breed }} · {{ dog.age }} · with you since {{ dog.handedOver }}</span>
            <span v-if="nextReminder(dog)" class="flex flex-wrap items-center gap-2 text-[13px]">
              {{ nextReminder(dog)!.title }} <AccountCareChip :status="nextReminder(dog)!.status" />
            </span>
          </span>
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="m-0 p-4 text-sm text-ink-muted">After handover, each dog you buy gets a record here: vaccinations, training and care.</p>
  </SectionPanel>
</template>
