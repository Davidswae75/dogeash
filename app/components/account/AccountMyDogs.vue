<script setup lang="ts">
import { onMounted } from 'vue'
import { useOwnedDogs } from '~/composables/useOwnedDogs'
import { dayLabel, dogSummary, nextDue, ownedDogLink, statusOf } from '~/utils/myDogs'

// Overview panel: the dogs you own, each with what it needs next
const { dogs, loaded, ensure } = useOwnedDogs()
onMounted(ensure)
</script>

<template>
  <SectionPanel title="My dogs" :meta="dogs.length ? `${dogs.length} at home` : undefined" see-all="/account/dogs" :see-all-label="dogs.length ? 'All records' : 'Add a dog'">
    <ul v-if="dogs.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="dog in dogs" :key="dog.id">
        <NuxtLink :to="ownedDogLink(dog)" class="flex items-center gap-4 rounded-lg p-3 text-ink no-underline hover:bg-surface-sunk">
          <AccountDogPortrait :name="dog.name" :photo="dog.photo" compact class="size-14 rounded-md" />
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong class="text-[15px] leading-5">{{ dog.name }}</strong>
            <span class="truncate text-[13px] text-ink-muted">{{ dogSummary(dog) || 'My dog' }}</span>
            <span v-if="nextDue(dog)" class="flex flex-wrap items-center gap-2 text-[13px]">
              {{ nextDue(dog)!.title }} · {{ dayLabel(nextDue(dog)!.dueOn) }} <AccountCareChip :status="statusOf(nextDue(dog)!.dueOn)" />
            </span>
          </span>
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="m-0 p-4 text-sm text-ink-muted">{{ loaded ? 'Add the dogs you own to keep their vaccinations, treatments and training in one place, with reminders.' : 'Loading…' }}</p>
  </SectionPanel>
</template>
