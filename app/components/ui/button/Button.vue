<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from "."
import { Loader2Icon } from "@lucide/vue"
import { cn } from "@/lib/utils"
import { Primitive } from "reka-ui"
import { buttonVariants } from "."

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
  /** Dogeash: show a spinner and block further clicks while something is working */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
})
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :as="as"
    :as-child="asChild"
    :disabled="props.loading || undefined"
    :aria-busy="props.loading || undefined"
    :class="cn(buttonVariants({ variant, size }), props.loading && 'cursor-wait disabled:opacity-80', props.class)"
  >
    <Loader2Icon v-if="props.loading && !asChild" class="animate-spin" aria-hidden="true" />
    <slot />
  </Primitive>
</template>
