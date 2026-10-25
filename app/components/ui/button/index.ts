import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

// Dogeash buttons: firm, 48px, bold label, verb first. See design/ash-marigold/components/Button
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border-2 border-transparent font-sans font-bold text-[15px] leading-none no-underline cursor-pointer transition-[background-color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  {
    variants: {
      variant: {
        // The main action on a page, one per view
        default: "bg-action text-on-action hover:bg-action-hover",
        // The single starting action on Home and the match flow
        marigold: "bg-marigold text-on-marigold hover:brightness-95",
        outline: "bg-transparent text-ink border-ink hover:bg-surface-sunk",
        ghost: "bg-transparent text-action px-2! hover:underline underline-offset-4",
        // Outline for charcoal blocks
        night: "bg-transparent text-on-night border-on-night hover:bg-white/10",
        link: "text-action underline-offset-4 hover:underline px-0!",
      },
      size: {
        default: "h-12 px-[22px]",
        sm: "h-[38px] px-4 text-sm rounded-[10px]",
        icon: "size-[42px] rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
