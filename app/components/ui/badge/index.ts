import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

// Dogeash status badges. Verified blue always carries the word. See design/ash-marigold/components/Badge
export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-sm font-sans font-bold text-xs leading-none tracking-[.02em] whitespace-nowrap w-fit shrink-0 [&>svg]:size-3.5 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        verified: "bg-verified-soft text-verified",
        level: "bg-ash-soft text-action",
        new: "bg-marigold text-on-marigold",
        neutral: "bg-surface-sunk text-ink-muted",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
