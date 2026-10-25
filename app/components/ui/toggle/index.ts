import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Toggle } from "./Toggle.vue"

export const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
        // Dogeash filter chip: pill, ink when pressed. See design/ash-marigold/components/SearchFilters
        chip:
          "h-9 px-3.5 rounded-full border-[1.5px] border-line-strong bg-surface text-ink font-semibold hover:bg-surface hover:text-ink data-[state=on]:bg-ink data-[state=on]:border-ink data-[state=on]:text-canvas",
        // Day / Night / Auto segments. See design/ash-marigold/components/ThemeToggle
        watch:
          "h-8 px-3 rounded-full text-[13px] font-semibold text-ink-muted bg-transparent hover:bg-transparent hover:text-ink data-[state=on]:bg-night data-[state=on]:text-on-night",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ToggleVariants = VariantProps<typeof toggleVariants>
