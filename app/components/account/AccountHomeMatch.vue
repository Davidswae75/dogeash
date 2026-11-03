<script setup lang="ts">
import { ArrowRight, TriangleAlert } from '@lucide/vue'
import { computed } from 'vue'
import type { BuyerProfile } from '~/utils/account'
import { marketRows } from '~/utils/market'
import { propertyTypes, protectionLevels } from '~/utils/protection'

// "What suits you", beside the Home profile form: the levels that fit the home, how many dogs match now,
// and a word of caution where the experience doesn't match the strongest dogs
const props = defineProps<{ profile: Partial<BuyerProfile> }>()

const property = computed(() => propertyTypes.find(p => p.value === props.profile.property))
// Level 5 dogs need an experienced handler; everyone else is pointed at the levels below
const levels = computed(() => (property.value?.levels ?? []).filter(l => l < 5 || ['experienced', 'professional'].includes(props.profile.experience ?? '')))
const matches = computed(() => (props.profile.property && props.profile.experience)
  ? marketRows.matchedTo({ city: '', children: false, otherPets: false, ...props.profile } as BuyerProfile).filter(d => levels.value.includes(d.level))
  : [])
const levelRange = computed(() => levels.value.length > 1 ? `Levels ${levels.value[0]}–${levels.value.at(-1)}` : levels.value.length ? `Level ${levels.value[0]}` : '')
const holdsBack = computed(() => property.value?.levels.includes(5) && !levels.value.includes(5))
</script>

<template>
  <aside class="flex flex-col gap-4 self-start rounded-xl bg-night p-5 text-on-night lg:sticky lg:top-[calc(var(--header-height)+16px)]">
    <span class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-marigold uppercase">What suits you</span>
    <template v-if="property">
      <strong class="font-display text-2xl leading-7 font-extrabold font-stretch-expanded">{{ levelRange }}</strong>
      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        <li v-for="l in levels" :key="l" class="flex items-baseline gap-2.5 text-sm">
          <span class="font-display font-extrabold text-marigold">{{ l }}</span>
          <span><strong>{{ protectionLevels[l].name }}.</strong> <span class="opacity-75">{{ protectionLevels[l].description }}</span></span>
        </li>
      </ul>
      <p v-if="holdsBack" class="m-0 flex gap-2 rounded-md bg-on-night/10 p-3 text-[13px] leading-[19px]">
        <TriangleAlert class="mt-0.5 size-4 shrink-0 text-marigold" aria-hidden="true" />
        Level 5 dogs are for experienced handlers, so they're left out of your matches.
      </p>
      <p v-if="profile.children" class="m-0 text-[13px] leading-[19px] opacity-80">Only dogs tested as safe with children.</p>
      <NuxtLink
        v-if="profile.experience"
        :to="{ path: '/dogs', query: { property: profile.property } }"
        class="flex items-center justify-between rounded-md bg-marigold px-3.5 py-2.5 text-sm font-bold text-on-marigold no-underline hover:brightness-95"
      >
        {{ matches.length }} {{ matches.length === 1 ? 'dog matches' : 'dogs match' }} now <ArrowRight class="size-4" aria-hidden="true" />
      </NuxtLink>
    </template>
    <p v-else class="m-0 text-sm leading-[22px] opacity-80">Choose what you're protecting and we'll show the protection levels that fit, and the dogs that match.</p>
  </aside>
</template>
