<script setup lang="ts">
import { Building2, Castle, Fence, House } from '@lucide/vue'
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import type { PropertyType, ProtectionLevel } from '~/utils/protection'
import { propertyTypes, protectionLevels } from '~/utils/protection'

// The filters on Find a guard dog, in the sidebar (wide screens) and the Filters sheet (phones):
// - Property as small cards with an icon and the level each usually needs
// - Protection level as one 1–5 scale: tap one level, or two to pick the range between them
// - City and Breed show their top 5 (by dogs), then "+ more"
// - Every option shows how many dogs it would leave; options that would leave none are dimmed
// Each group has its own Clear. `count(group, value)` is how many dogs that one choice would show.
type Group = 'property' | 'city' | 'breed' | 'children'
const props = defineProps<{
  cities: string[]
  breeds: string[]
  count: (group: Group, value: string) => number
  levelCount: (level: ProtectionLevel) => number
}>()
const properties = defineModel<PropertyType[]>('properties', { required: true })
const levels = defineModel<ProtectionLevel[]>('levels', { required: true })
const cities = defineModel<string[]>('citiesOn', { required: true })
const breeds = defineModel<string[]>('breedsOn', { required: true })
const household = defineModel<string[]>('household', { required: true })

const icons: Record<PropertyType, Component> = { home: House, compound: Fence, estate: Castle, business: Building2 }
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v])

// Level: none → that level; one level → the range to the new one (or off, tapping it again); a range → start over
function pickLevel(n: ProtectionLevel) {
  const on = levels.value
  if (on.length === 1 && on[0] === n) return (levels.value = [])
  if (on.length === 1) {
    const [a, b] = [Math.min(on[0]!, n), Math.max(on[0]!, n)]
    return (levels.value = Array.from({ length: b - a + 1 }, (_, i) => (a + i) as ProtectionLevel))
  }
  levels.value = [n]
}
const levelLine = computed(() => {
  const on = [...levels.value].sort()
  if (!on.length) return 'Tap one level, or two to pick a range'
  const first = on[0]!
  const last = on.at(-1)!
  return first === last ? `${first} · ${protectionLevels[first].name}` : `${first}–${last} · ${protectionLevels[first].name} to ${protectionLevels[last].name}`
})

// Top 5 by dogs (chosen ones always shown), the rest behind "+ more"
const openCity = ref(false)
const openBreed = ref(false)
function top(list: string[], group: Group, on: string[], open: boolean) {
  const sorted = [...list].sort((a, b) => props.count(group, b) - props.count(group, a))
  if (open || sorted.length <= 6) return { shown: sorted, hidden: 0 }
  const shown = sorted.filter((v, i) => i < 5 || on.includes(v))
  return { shown, hidden: sorted.length - shown.length }
}
const cityList = computed(() => top(props.cities, 'city', cities.value, openCity.value))
const breedList = computed(() => top(props.breeds, 'breed', breeds.value, openBreed.value))

const heading = 'text-xs leading-4 font-bold tracking-[.08em] text-ink-muted uppercase'
const clear = 'cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline'
const chip = (on: boolean, empty: boolean) => [
  'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 text-sm font-semibold ring-1 transition-colors disabled:cursor-not-allowed',
  on ? 'bg-ink text-canvas ring-ink' : empty ? 'bg-transparent text-ink-muted/60 ring-line' : 'bg-transparent text-ink ring-line-strong hover:ring-ink',
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Property: cards with the level each usually needs -->
    <section class="flex flex-col gap-2.5" aria-labelledby="f-property">
      <div class="flex items-center justify-between gap-2">
        <h3 id="f-property" :class="[heading, 'm-0']">Property</h3>
        <button v-if="properties.length" type="button" :class="clear" @click="properties = []">Clear</button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="p in propertyTypes"
          :key="p.value"
          type="button"
          :aria-pressed="properties.includes(p.value)"
          :disabled="!properties.includes(p.value) && !props.count('property', p.value)"
          :class="[
            'flex cursor-pointer flex-col items-start gap-1 rounded-lg border-0 p-2.5 text-left ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-45',
            properties.includes(p.value) ? 'bg-ink text-canvas ring-ink' : 'bg-transparent text-ink ring-line-strong hover:ring-ink',
          ]"
          @click="properties = toggle(properties, p.value)"
        >
          <span class="flex w-full items-center justify-between">
            <component :is="icons[p.value]" class="size-[18px]" aria-hidden="true" />
            <span class="font-mono text-[11px] opacity-70">{{ props.count('property', p.value) }}</span>
          </span>
          <span class="text-sm font-bold">{{ p.label }}</span>
          <span class="text-[11px] leading-4 opacity-70">{{ p.hint.split(' · ')[0] }}</span>
        </button>
      </div>
    </section>

    <!-- Protection level: one scale -->
    <section class="flex flex-col gap-2.5" aria-labelledby="f-level">
      <div class="flex items-center justify-between gap-2">
        <h3 id="f-level" :class="[heading, 'm-0']">Protection level</h3>
        <button v-if="levels.length" type="button" :class="clear" @click="levels = []">Clear</button>
      </div>
      <div class="grid grid-cols-5 overflow-hidden rounded-lg ring-1 ring-line-strong" role="group" aria-label="Protection level, 1 to 5">
        <button
          v-for="n in ([1, 2, 3, 4, 5] as ProtectionLevel[])"
          :key="n"
          type="button"
          :aria-pressed="levels.includes(n)"
          :title="`${n} · ${protectionLevels[n].name} · ${props.levelCount(n)} dogs`"
          :class="[
            'flex h-12 cursor-pointer flex-col items-center justify-center gap-0.5 border-0 border-l border-line first:border-l-0 transition-colors',
            levels.includes(n) ? 'bg-marigold text-on-marigold' : props.levelCount(n) ? 'bg-transparent text-ink hover:bg-surface-sunk' : 'bg-transparent text-ink-muted/50',
          ]"
          @click="pickLevel(n)"
        >
          <span class="font-display text-base leading-none font-extrabold">{{ n }}</span>
          <span class="font-mono text-[10px] leading-none opacity-70">{{ props.levelCount(n) }}</span>
        </button>
      </div>
      <span class="text-[13px] leading-5 text-ink-muted">{{ levelLine }}</span>
    </section>

    <!-- City and Breed: top 5, then more -->
    <section v-for="g in ([{ id: 'city', title: 'City', list: cityList, model: cities, open: openCity }, { id: 'breed', title: 'Breed', list: breedList, model: breeds, open: openBreed }] as const)" :key="g.id" class="flex flex-col gap-2.5" :aria-labelledby="`f-${g.id}`">
      <div class="flex items-center justify-between gap-2">
        <h3 :id="`f-${g.id}`" :class="[heading, 'm-0']">{{ g.title }}</h3>
        <button v-if="g.model.length" type="button" :class="clear" @click="g.id === 'city' ? (cities = []) : (breeds = [])">Clear</button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="v in g.list.shown"
          :key="v"
          type="button"
          :aria-pressed="g.model.includes(v)"
          :disabled="!g.model.includes(v) && !props.count(g.id, v)"
          :class="chip(g.model.includes(v), !props.count(g.id, v))"
          @click="g.id === 'city' ? (cities = toggle(cities, v)) : (breeds = toggle(breeds, v))"
        >
          {{ v }}<span class="font-mono text-[11px] opacity-60">{{ props.count(g.id, v) }}</span>
        </button>
        <button v-if="g.list.hidden" type="button" class="h-9 cursor-pointer rounded-full border-0 bg-transparent px-2 text-sm font-semibold text-ink underline decoration-marigold decoration-2 underline-offset-4" @click="g.id === 'city' ? (openCity = true) : (openBreed = true)">+{{ g.list.hidden }} more</button>
        <button v-else-if="g.open && g.list.shown.length > 6" type="button" class="h-9 cursor-pointer rounded-full border-0 bg-transparent px-2 text-sm font-semibold text-ink-muted hover:text-ink" @click="g.id === 'city' ? (openCity = false) : (openBreed = false)">Show fewer</button>
      </div>
    </section>

    <!-- Household -->
    <section class="flex flex-col gap-2.5" aria-labelledby="f-household">
      <h3 id="f-household" :class="[heading, 'm-0']">Household</h3>
      <div class="flex flex-wrap gap-2">
        <button type="button" :aria-pressed="household.includes('children')" :class="chip(household.includes('children'), !props.count('children', 'children'))" :disabled="!household.includes('children') && !props.count('children', 'children')" @click="household = toggle(household, 'children')">
          Safe with children<span class="font-mono text-[11px] opacity-60">{{ props.count('children', 'children') }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
