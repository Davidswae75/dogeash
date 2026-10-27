<script setup lang="ts">
// Header pill for people who work at a store: the store, and how many enquiries are waiting.
// Wide screens only; on phones the store lives in the menu.
const { memberships } = useSession()
const first = computed(() => memberships.value[0])
const waiting = computed(() => (first.value ? storeActivity[first.value.storeId]?.enquiries ?? 0 : 0))
</script>

<template>
  <NuxtLink
    v-if="first"
    to="/dashboard"
    class="hidden h-[38px] items-center gap-2 rounded-full border-[1.5px] border-line-strong py-1 pr-3 pl-1 text-[13px] font-semibold text-ink no-underline hover:border-ink lg:inline-flex"
    :aria-label="`${first.store.name} dashboard${waiting ? `, ${waiting} new enquiries` : ''}`"
  >
    <span class="grid size-7 shrink-0 place-items-center rounded-full bg-night font-display text-[10px] font-extrabold text-on-night" aria-hidden="true">{{ first.store.initials }}</span>
    <span class="max-w-[9em] truncate">{{ first.store.name }}</span>
    <span v-if="waiting" class="grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1.5 text-[11px] font-bold text-on-marigold">{{ waiting }}</span>
  </NuxtLink>
</template>
