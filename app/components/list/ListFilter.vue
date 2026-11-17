<script setup lang="ts" generic="T extends string | number">
import { Check, ChevronDown } from '@lucide/vue'
import { computed } from 'vue'

// One compact filter: a button with its name ("Level", or "Level: 4" / "Level: 3 +1" when chosen) that opens a
// short checklist. Several can be ticked unless `single`. Used in every list's filter bar.
// `short` is how a chosen option reads on the button ("4" for "Level 4").
const props = defineProps<{ label: string, options: readonly { value: T, label: string, hint?: string, short?: string }[], single?: boolean }>()
const model = defineModel<T[]>({ default: () => [] })

const summary = computed(() => {
  const chosen = props.options.filter(o => model.value.includes(o.value))
  if (!chosen.length) return ''
  const name = (o: (typeof chosen)[number]) => o.short ?? o.label
  return chosen.length <= 2 ? chosen.map(name).join(', ') : `${name(chosen[0]!)} +${chosen.length - 1}`
})
function toggle(v: T) {
  if (props.single) model.value = model.value.includes(v) ? [] : [v]
  else model.value = model.value.includes(v) ? model.value.filter(x => x !== v) : [...model.value, v]
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        :class="[
          'inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-0 px-3 text-sm font-semibold whitespace-nowrap ring-1 transition-colors',
          summary ? 'bg-ink text-canvas ring-ink' : 'bg-surface text-ink ring-line-strong hover:ring-ink',
        ]"
      >
        <span :class="summary && 'opacity-70'">{{ props.label }}{{ summary ? ':' : '' }}</span><span v-if="summary" class="max-w-[140px] truncate">{{ summary }}</span>
        <ChevronDown class="size-4 opacity-70" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="max-h-[60vh] min-w-[200px] overflow-y-auto rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
      <DropdownMenuItem
        v-for="o in props.options"
        :key="String(o.value)"
        class="cursor-pointer gap-2.5 py-2"
        @select.prevent="toggle(o.value)"
      >
        <span :class="['grid size-[18px] shrink-0 place-items-center rounded-[5px] ring-[1.5px]', model.includes(o.value) ? 'bg-ink text-canvas ring-ink' : 'ring-line-strong']" aria-hidden="true">
          <Check v-if="model.includes(o.value)" class="size-3" :stroke-width="3" />
        </span>
        <span class="flex min-w-0 flex-col">
          <span class="text-sm">{{ o.label }}</span>
          <span v-if="o.hint" class="text-xs text-ink-muted">{{ o.hint }}</span>
        </span>
      </DropdownMenuItem>
      <template v-if="model.length">
        <DropdownMenuSeparator class="bg-line" />
        <DropdownMenuItem class="cursor-pointer justify-center text-[13px] font-semibold text-ink-muted" @select="model = []">Clear {{ props.label.toLowerCase() }}</DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
