<script setup lang="ts">
import { ArrowLeftRight, ShoppingBag, Stethoscope } from '@lucide/vue'
import { useProviderDashboard } from '~/composables/useProviderDashboard'
import { useSession } from '~/composables/useSession'

// The one-click switch between a provider's two sides: "Switch to buyer account" (My Dogeash: shortlist,
// own dogs, visits) or "Switch to provider dashboard" (bookings and listing). Emits `switch`.
// `compact` (the narrow sidebar): no small heading, and the title may wrap.
const props = defineProps<{ to: 'buyer' | 'provider', compact?: boolean }>()
const emit = defineEmits<{ switch: [] }>()
const { providers } = useSession()
const { requests } = useProviderDashboard()
</script>

<template>
  <button
    type="button"
    :class="[
      'group flex w-full cursor-pointer items-center rounded-lg border-0 text-left transition-colors',
      props.compact ? 'gap-2.5 p-2.5' : 'gap-3 p-3',
      props.to === 'provider' ? 'bg-night text-on-night hover:bg-night/90' : 'bg-surface-sunk text-ink ring-1 ring-line hover:ring-ink',
    ]"
    @click="emit('switch')"
  >
    <span :class="['grid size-9 shrink-0 place-items-center rounded-lg', props.to === 'provider' ? 'bg-marigold text-on-marigold' : 'bg-canvas text-ink ring-1 ring-line']">
      <component :is="props.to === 'provider' ? Stethoscope : ShoppingBag" class="size-[18px]" aria-hidden="true" />
    </span>
    <span class="flex min-w-0 flex-1 flex-col">
      <span v-if="!props.compact" :class="['font-mono text-[10px] font-semibold tracking-[.12em] uppercase', props.to === 'provider' ? 'text-marigold' : 'text-ink-muted']">
        {{ props.to === 'provider' ? 'Your care practice' : 'Buying for yourself?' }}
      </span>
      <strong :class="['text-sm leading-5', !props.compact && 'truncate']">{{ props.to === 'provider' ? 'Switch to provider dashboard' : 'Switch to buyer account' }}</strong>
      <span class="truncate text-xs opacity-75">
        {{ props.to === 'provider' ? (requests.length ? `${requests.length} ${requests.length === 1 ? 'request' : 'requests'} waiting · ${providers[0]?.name}` : providers[0]?.name) : 'Shortlist, your dogs, visits' }}
      </span>
    </span>
    <ArrowLeftRight class="size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
  </button>
</template>
