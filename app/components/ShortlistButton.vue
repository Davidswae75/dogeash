<script setup lang="ts">
import { Heart } from '@lucide/vue'

// Save a dog to the shortlist. "icon" sits on a card's photo; "button" is a full button on the dog page.
const props = withDefaults(defineProps<{ fileNo: string, name: string, variant?: 'icon' | 'button' }>(), { variant: 'icon' })

const { has, toggle, remove, count } = useShortlist()
const { signedIn } = useSession()
const notify = useNotify()
const route = useRoute()
const saved = computed(() => has(props.fileNo))

// Guests who save a third dog are offered an account, once per browser; saving never needs one
const NUDGE_AT = 3
const nudge = useFirstVisit('shortlist-account-nudge')

function onToggle() {
  const dog = findDog(props.fileNo)
  if (!dog) return toggle(props.fileNo)
  if (saved.value) return notify.shortlistRemoved(dog, remove(props.fileNo))
  toggle(props.fileNo)
  if (!signedIn.value && count.value === NUDGE_AT && nudge.isFirstVisit.value) {
    nudge.dismiss()
    notify.keepShortlist(count.value, route.fullPath)
  }
  else notify.shortlistSaved(dog)
}

const label = computed(() => saved.value ? `Remove ${props.name} from your shortlist` : `Save ${props.name} to your shortlist`)
</script>

<template>
  <!-- The shortlist lives in this browser, so the saved state is only known after the page loads -->
  <ClientOnly>
    <button
      v-if="props.variant === 'icon'"
      type="button"
      :aria-pressed="saved"
      :aria-label="label"
      :class="[
        'grid size-10 cursor-pointer place-items-center rounded-full border-0 shadow-[0_2px_8px_rgba(0,0,0,.18)] transition-[transform,background-color] duration-200 hover:scale-110 active:scale-95',
        saved ? 'bg-marigold text-on-marigold' : 'bg-surface text-ink',
      ]"
      @click.stop.prevent="onToggle"
    >
      <Heart :class="['size-[18px] transition-transform', saved && 'scale-110 fill-current']" aria-hidden="true" />
    </button>
    <Button v-else :variant="saved ? 'marigold' : 'outline'" :aria-pressed="saved" class="w-full" @click="onToggle">
      <Heart :class="['size-[18px]', saved && 'fill-current']" aria-hidden="true" />
      {{ saved ? 'Saved to shortlist' : 'Save to shortlist' }}
    </Button>

    <template #fallback>
      <span v-if="props.variant === 'icon'" class="grid size-10 place-items-center rounded-full bg-surface text-ink shadow-[0_2px_8px_rgba(0,0,0,.18)]" aria-hidden="true">
        <Heart class="size-[18px]" />
      </span>
      <span v-else class="block h-12 w-full rounded-md border-2 border-line" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>
