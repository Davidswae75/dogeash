<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import type { SiteNavGroup } from '~/utils/siteNav'
import { cn } from '~/lib/utils'

// One dropdown in the header. Not modal, so the page keeps scrolling and doesn't shift while it's open.
const props = defineProps<{ group: SiteNavGroup }>()
const route = useRoute()
const pathOf = (to: string) => to.split(/[?#]/)[0]!
const active = computed(() => props.group.links.some(l => route.path.startsWith(pathOf(l.to))))
</script>

<template>
  <DropdownMenu :modal="false">
    <DropdownMenuTrigger
      :class="cn(
        'group inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 py-1 whitespace-nowrap text-ink-muted hover:text-ink hover:shadow-[0_3px_0_var(--marigold)] data-[state=open]:text-ink data-[state=open]:shadow-[0_3px_0_var(--marigold)]',
        active && 'text-ink shadow-[0_3px_0_var(--marigold)]',
      )"
    >
      {{ props.group.label }}
      <ChevronDown class="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" :side-offset="12" class="w-[320px] rounded-lg border-line bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
      <DropdownMenuItem v-for="link in props.group.links" :key="link.to" as-child class="cursor-pointer gap-3 rounded-md p-2.5">
        <NuxtLink :to="link.to" class="text-ink no-underline">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-marigold-soft text-marigold-ink">
            <component :is="link.icon" class="size-[18px] text-current" aria-hidden="true" />
          </span>
          <span class="flex min-w-0 flex-col">
            <strong class="text-sm leading-5">{{ link.label }}</strong>
            <span class="text-[13px] leading-[18px] text-ink-muted">{{ link.text }}</span>
          </span>
        </NuxtLink>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
