<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { niceTicks, shortDay } from '~/utils/admin'

// One measure over time: a 2px line over a soft fill, a recessive grid, dates along the bottom.
// Hovering (or touching) shows a crosshair on the nearest day with its date and value.
// The chart measures its own width, so text stays crisp at any size.
const props = defineProps<{ points: { day: string, value: number }[], label: string, unit: string }>()

const box = ref<HTMLElement>()
const width = ref(640)
const H = 240
const pad = { top: 12, right: 12, bottom: 26, left: 36 }
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([e]) => { width.value = Math.max(280, e!.contentRect.width) })
  if (box.value) observer.observe(box.value)
})
onBeforeUnmount(() => observer?.disconnect())

const ticks = computed(() => niceTicks(Math.max(0, ...props.points.map(p => p.value))))
const top = computed(() => ticks.value.at(-1) || 1)
const plotW = computed(() => width.value - pad.left - pad.right)
const plotH = H - pad.top - pad.bottom
const x = (i: number) => pad.left + (props.points.length > 1 ? (i / (props.points.length - 1)) * plotW.value : plotW.value / 2)
const y = (v: number) => pad.top + plotH - (v / top.value) * plotH

const line = computed(() => props.points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' '))
const area = computed(() => `${line.value} L${x(props.points.length - 1).toFixed(1)},${pad.top + plotH} L${pad.left},${pad.top + plotH} Z`)
// About five dates along the bottom, always the first and the last
const xLabels = computed(() => {
  const n = props.points.length
  const every = Math.max(1, Math.round((n - 1) / 4))
  return props.points.map((p, i) => ({ i, day: p.day })).filter(({ i }) => i === 0 || i === n - 1 || (i % every === 0 && n - 1 - i > every / 2))
})

const hover = ref<number>()
function onMove(e: PointerEvent) {
  const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
  const px = e.clientX - rect.left
  const i = Math.round(((px - pad.left) / plotW.value) * (props.points.length - 1))
  hover.value = Math.min(props.points.length - 1, Math.max(0, i))
}
const tip = computed(() => {
  if (hover.value === undefined) return undefined
  const p = props.points[hover.value]!
  const left = x(hover.value)
  return { p, left, flip: left > width.value - 150, top: y(p.value) }
})
const total = computed(() => props.points.reduce((s, p) => s + p.value, 0))
</script>

<template>
  <div ref="box" class="relative w-full select-none">
    <svg
      :width="width"
      :height="H"
      :viewBox="`0 0 ${width} ${H}`"
      class="block touch-none"
      role="img"
      :aria-label="`${props.label}: ${total} over ${props.points.length} days`"
      @pointermove="onMove"
      @pointerdown="onMove"
      @pointerleave="hover = undefined"
    >
      <!-- Grid and the value axis -->
      <g>
        <template v-for="t in ticks" :key="t">
          <line :x1="pad.left" :x2="width - pad.right" :y1="y(t)" :y2="y(t)" stroke="var(--chart-grid)" stroke-width="1" />
          <text :x="pad.left - 8" :y="y(t) + 3.5" text-anchor="end" class="fill-ink-muted font-mono text-[10px]">{{ t }}</text>
        </template>
      </g>
      <!-- Dates -->
      <text v-for="l in xLabels" :key="l.i" :x="x(l.i)" :y="H - 8" :text-anchor="l.i === 0 ? 'start' : l.i === props.points.length - 1 ? 'end' : 'middle'" class="fill-ink-muted font-mono text-[10px]">{{ shortDay(l.day) }}</text>
      <!-- The measure -->
      <path :d="area" fill="var(--chart-fill)" opacity=".16" />
      <path :d="line" fill="none" stroke="var(--chart-line)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <!-- Crosshair on the hovered day -->
      <g v-if="tip">
        <line :x1="tip.left" :x2="tip.left" :y1="pad.top" :y2="pad.top + plotH" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="3 3" />
        <circle :cx="tip.left" :cy="tip.top" r="5" fill="var(--chart-line)" stroke="var(--surface)" stroke-width="2" />
      </g>
    </svg>
    <div
      v-if="tip"
      class="pointer-events-none absolute top-2 z-10 flex min-w-[120px] flex-col gap-0.5 rounded-md bg-night px-3 py-2 text-on-night shadow-lg"
      :style="tip.flip ? { right: `${width - tip.left + 12}px` } : { left: `${tip.left + 12}px` }"
    >
      <span class="font-mono text-[10.5px] tracking-[.08em] uppercase opacity-70">{{ shortDay(tip.p.day) }}</span>
      <span class="text-sm"><strong class="font-mono text-base">{{ tip.p.value }}</strong> {{ props.unit }}</span>
    </div>
  </div>
</template>
