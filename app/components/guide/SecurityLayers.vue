<script setup lang="ts">
// Plan view of a compound showing where each layer of security works. The dog owns the yard.
const layers = [
  { label: 'Wall, fence and gate', note: 'Keeps people out', tone: 'fill-ash' },
  { label: 'Guard dog', note: 'Patrols the yard, warns, responds', tone: 'fill-marigold' },
  { label: 'Locks, burglary bars, alarm', note: 'Slows entry to the house', tone: 'fill-surface' },
  { label: 'Your family', note: 'Safe room and a phone', tone: 'fill-night' },
]
</script>

<template>
  <div class="grid items-center gap-6 md:grid-cols-[1.1fr_1fr]">
    <svg viewBox="0 0 400 300" class="block h-auto w-full max-w-full" role="img" aria-labelledby="layers-title layers-desc">
      <title id="layers-title">Layers of home security</title>
      <desc id="layers-desc">Four nested layers: the compound wall on the outside, the guard dog patrolling the yard, locks and alarms on the house, and the family inside.</desc>
      <rect class="fill-ash" x="8" y="8" width="384" height="284" rx="28" />
      <rect class="fill-marigold" x="34" y="34" width="332" height="232" rx="20" />
      <rect class="fill-surface" x="112" y="78" width="176" height="144" rx="14" />
      <rect class="fill-night" x="160" y="114" width="80" height="72" rx="10" />
      <!-- Patrol route through the yard -->
      <rect x="62" y="56" width="276" height="188" rx="18" fill="none" class="stroke-night" stroke-width="2.5" stroke-dasharray="2 9" stroke-linecap="round" />
      <circle cx="338" cy="150" r="8" class="fill-night" />
      <circle cx="338" cy="150" r="4" class="fill-marigold" />
      <!-- Gate gap -->
      <rect class="fill-ash" x="176" y="264" width="48" height="4" />
      <g class="fill-on-marigold font-mono text-[9px] font-semibold tracking-[.12em]">
        <text x="200" y="50" text-anchor="middle">PATROL ROUTE</text>
      </g>
      <text x="200" y="284" text-anchor="middle" class="fill-on-ash font-mono text-[9px] font-semibold tracking-[.12em]">GATE</text>
    </svg>
    <ol class="m-0 flex list-none flex-col gap-3 p-0">
      <li v-for="layer in layers" :key="layer.label" class="flex items-start gap-3">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" class="mt-0.5 shrink-0">
          <rect width="22" height="22" rx="6" :class="layer.tone" class="stroke-line" stroke-width="1" />
        </svg>
        <span>
          <strong class="block text-[15px] leading-[22px]">{{ layer.label }}</strong>
          <span class="text-sm leading-[22px] text-ink-muted">{{ layer.note }}</span>
        </span>
      </li>
    </ol>
  </div>
</template>
