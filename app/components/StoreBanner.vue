<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { Store } from '~/utils/stores'
import { cn } from '~/lib/utils'
import { computed } from 'vue'

// The store's banner: its uploaded photo when it has one, otherwise its initials set huge on one of the
// brand blocks. Either way a dashed patrol route and the store's file line in mono sit on top.
const props = withDefaults(defineProps<{ store: Store, size?: 'tile' | 'hero', class?: HTMLAttributes['class'] }>(), { size: 'tile' })

// Each store keeps the same tone; neighbouring stores differ
const tones = [
  { bg: 'bg-night', ink: 'text-on-night', outline: 'var(--marigold)', route: 'border-marigold/60', solid: 'text-marigold' },
  { bg: 'bg-marigold', ink: 'text-on-marigold', outline: 'var(--on-marigold)', route: 'border-on-marigold/40', solid: 'text-on-marigold' },
  { bg: 'bg-ash', ink: 'text-on-ash', outline: 'var(--on-ash)', route: 'border-on-ash/40', solid: 'text-night' },
]
const tone = computed(() => tones[(Number(props.store.id.replace(/\D/g, '')) - 1) % tones.length]!)
const hero = computed(() => props.size === 'hero')
const photo = computed(() => !!props.store.banner)
</script>

<template>
  <div :class="cn('relative isolate overflow-hidden', photo ? 'bg-night text-on-night' : [tone.bg, tone.ink], props.class)">
    <template v-if="photo">
      <img :src="props.store.banner" alt="" class="absolute inset-0 -z-10 size-full object-cover">
      <!-- Darkens the top so the file line reads on any photo -->
      <span class="absolute inset-0 -z-10 bg-gradient-to-b from-night/70 via-night/10 to-transparent" aria-hidden="true" />
    </template>
    <!-- Patrol route around the banner -->
    <span
      :class="cn('pointer-events-none absolute rounded-[28px] border-2 border-dashed', photo ? 'border-on-night/50' : tone.route, hero ? 'inset-5 sm:inset-7' : 'inset-3.5')"
      aria-hidden="true"
    />

    <!-- Initials: one solid, one outlined echo behind it -->
    <template v-if="!photo">
      <span
        :class="cn('pointer-events-none absolute leading-none mega select-none text-outline', hero ? '-right-4 top-1/2 -translate-y-[46%] text-[clamp(180px,24vw,320px)]' : '-right-2 top-1/2 -translate-y-[46%] text-[150px]')"
        :style="{ WebkitTextStrokeColor: tone.outline }"
        aria-hidden="true"
      >{{ props.store.initials }}</span>
      <span
        :class="cn('pointer-events-none absolute leading-none mega select-none', tone.solid, hero ? 'bottom-10 left-9 text-[clamp(72px,10vw,128px)] sm:bottom-14 sm:left-11' : 'bottom-8 left-6 text-[60px]')"
        aria-hidden="true"
      >{{ props.store.initials }}</span>
    </template>

    <!-- File line -->
    <span
      :class="cn('absolute font-mono font-semibold tracking-[.12em] uppercase', hero ? 'top-9 left-9 text-xs sm:top-11 sm:left-11' : 'top-6 left-6 text-[10px]')"
    >
      {{ props.store.id }} · {{ props.store.city }} · Since {{ props.store.founded }}
    </span>

    <span class="absolute inset-x-0 bottom-0 h-1.5 hazard-thin" aria-hidden="true" />
    <slot />
  </div>
</template>
