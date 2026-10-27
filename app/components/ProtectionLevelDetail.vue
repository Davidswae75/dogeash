<script setup lang="ts">
import { Check, Minus } from '@lucide/vue'
import type { ProtectionLevel } from '~/utils/protection'

// One level on the Protection levels page: the number, what the dog does and won't do,
// who it suits, the price range on Dogeash today, and dogs at that level
const props = defineProps<{ level: ProtectionLevel }>()

const info = protectionLevels[props.level]
const detail = protectionLevelDetails[props.level]
const suits = propertyTypes.filter(p => p.levels.includes(props.level))
const dogs = sampleDogs.filter(d => d.level === props.level)
const prices = dogs.map(d => d.priceNaira)
const priceRange = prices.length
  ? (Math.min(...prices) === Math.max(...prices) ? formatNaira(prices[0]!) : `${formatNaira(Math.min(...prices))} – ${formatNaira(Math.max(...prices))}`)
  : 'No dogs listed yet'
</script>

<template>
  <section :id="`level-${props.level}`" class="flex scroll-mt-28 flex-col gap-6 border-t-4 border-ink pt-6">
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-10">
      <div class="flex flex-col gap-3">
        <span class="flex items-baseline gap-4">
          <b class="font-display text-[clamp(64px,7vw,96px)] leading-[.8] font-black tracking-[-.04em] [font-stretch:120%]">{{ props.level }}</b>
          <span class="font-mono text-[11px] font-semibold tracking-[.12em] text-ink-muted uppercase">Level {{ props.level }} of 5</span>
        </span>
        <h2 class="m-0 mega text-[clamp(26px,2.8vw,36px)] leading-none">{{ info.name }}</h2>
        <p class="m-0 max-w-[30em] text-[15px] leading-6 text-ink-muted">{{ info.description }}</p>
        <dl class="m-0 mt-2 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5">
          <dt class="font-mono text-[10.5px] leading-5 font-semibold tracking-[.12em] text-ink-muted uppercase">Suits</dt>
          <dd class="m-0 flex flex-wrap gap-1.5">
            <NuxtLink
              v-for="p in suits"
              :key="p.value"
              :to="{ path: '/dogs', query: { property: p.value, level: props.level } }"
              class="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line-strong px-2.5 py-0.5 text-[13px] font-semibold text-ink no-underline hover:border-ink"
            >
              <AppIcon :name="p.value" :size="14" />{{ p.label }}
            </NuxtLink>
          </dd>
          <dt class="font-mono text-[10.5px] leading-5 font-semibold tracking-[.12em] text-ink-muted uppercase">Owner</dt>
          <dd class="m-0 text-sm leading-5 font-semibold">{{ detail.owner }}</dd>
          <dt class="font-mono text-[10.5px] leading-5 font-semibold tracking-[.12em] text-ink-muted uppercase">Price</dt>
          <dd class="m-0 text-sm leading-5 font-semibold">{{ priceRange }}</dd>
        </dl>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="flex flex-col gap-3 rounded-lg bg-surface p-5 ring-1 ring-line">
          <span class="font-mono text-[10.5px] font-semibold tracking-[.12em] uppercase">What it does</span>
          <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
            <li v-for="item in detail.does" :key="item" class="flex gap-2.5 text-sm leading-5">
              <span class="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-marigold text-on-marigold"><Check class="size-3" aria-hidden="true" /></span>{{ item }}
            </li>
          </ul>
        </div>
        <div class="flex flex-col gap-3 rounded-lg bg-ash-soft p-5">
          <span class="font-mono text-[10.5px] font-semibold tracking-[.12em] uppercase">What it won't do</span>
          <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
            <li v-for="item in detail.doesNot" :key="item" class="flex gap-2.5 text-sm leading-5">
              <span class="mt-px grid size-5 shrink-0 place-items-center rounded-full ring-[1.5px] ring-line-strong ring-inset"><Minus class="size-3" aria-hidden="true" /></span>{{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <MarketRow v-if="dogs.length" :title="`Level ${props.level}`" outline="dogs" :subtitle="`${dogs.length} on Dogeash now`" :see-all="`/dogs?level=${props.level}`">
      <K9Card v-for="dog in dogs" :key="dog.fileNo" :dog="dog" class="w-[260px] sm:w-[280px]" />
    </MarketRow>
  </section>
</template>
