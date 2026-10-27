<script setup lang="ts">
// A section that isn't built yet: what it's for, what will live here, and a way back
const props = defineProps<{ title: string, text: string, plan: string[], back: { to: string, label: string } }>()
</script>

<template>
  <div class="flex min-h-[60vh] animate-rise items-center justify-center">
    <div class="flex w-full max-w-[520px] flex-col gap-5 rounded-xl bg-surface p-8 ring-1 ring-line">
      <span class="w-fit rounded-full bg-marigold-soft px-3 py-1 text-xs font-bold tracking-[.08em] uppercase">Coming next</span>
      <div class="flex flex-col gap-2">
        <h1 class="m-0 mega text-[clamp(28px,3vw,36px)] leading-none">{{ props.title }}</h1>
        <p class="m-0 text-[15px] leading-6 text-ink-muted">{{ props.text }}</p>
      </div>
      <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
        <li v-for="item in props.plan" :key="item" class="flex items-center gap-3 text-[15px]">
          <span class="size-2 shrink-0 rounded-[2px] bg-marigold" aria-hidden="true" />{{ item }}
        </li>
      </ul>
      <Button as-child variant="outline" class="w-fit">
        <NuxtLink :to="props.back.to">{{ props.back.label }}</NuxtLink>
      </Button>
    </div>
  </div>
</template>
