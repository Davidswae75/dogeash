<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import type { OwnedDog } from '~/utils/myDogs'
import { cn } from '~/lib/utils'

// A dog you own, on the My dogs page: who it is, its guarantee, and what it needs next
const props = defineProps<{ dog: OwnedDog }>()
const store = computed(() => getStore(props.dog.storeId))
const next = computed(() => nextReminder(props.dog))
</script>

<template>
  <NuxtLink :to="ownedDogLink(props.dog)" class="group flex animate-rise flex-col overflow-hidden rounded-xl bg-surface text-ink no-underline ring-1 ring-line transition-shadow hover:ring-2 hover:ring-ink">
    <div class="flex items-center justify-between bg-night px-4 py-2 font-mono text-[11px] font-semibold tracking-[.12em] text-on-night uppercase">
      <span>K9 file · {{ props.dog.fileNo }}</span>
      <span class="flex items-center gap-1.5"><span class="size-1.5 rounded-full bg-marigold" aria-hidden="true" />At home</span>
    </div>
    <AccountDogPortrait :name="props.dog.name" :photo="props.dog.photo" class="aspect-[16/9] w-full rounded-none" />
    <div class="flex flex-1 flex-col gap-4 p-5">
      <div class="flex flex-col gap-1">
        <strong class="font-display text-2xl leading-7 font-extrabold font-stretch-expanded">{{ props.dog.name }}</strong>
        <span class="text-sm text-ink-muted">{{ props.dog.breed }} · {{ props.dog.sex }} · {{ props.dog.age }} · from {{ store?.name }}</span>
      </div>
      <ProtectionScale :level="props.dog.level" />
      <div v-if="next" :class="cn('flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-semibold', careStatus[next.status].tone)">
        <span :class="cn('size-1.5 shrink-0 rounded-full', careStatus[next.status].dot)" aria-hidden="true" />
        <span class="flex-1">{{ next.title }}</span>
        <span class="font-mono text-[11px]">{{ careStatus[next.status].label }} · {{ next.due }}</span>
      </div>
      <span class="mt-auto flex items-center justify-between text-sm font-bold">
        Open record <ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </div>
  </NuxtLink>
</template>
