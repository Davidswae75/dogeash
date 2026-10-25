<template>
  <div role="status" class="flex max-w-[360px] items-center gap-3 rounded-md bg-night px-4 py-3 text-sm font-semibold text-on-night">
    <AppIcon name="check" :size="18" class="shrink-0 text-marigold" />
    <slot />
  </div>
</template>
