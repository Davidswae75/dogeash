<script setup lang="ts">
// Dashboard sections that aren't built yet: say what will live here
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const section = dashboardSections[String(route.params.section)]
if (!section) throw createError({ statusCode: 404, statusMessage: 'No dashboard section with that name' })

useSeoMeta({ title: `${section.title} · Store dashboard · Dogeash`, robots: 'noindex' })
</script>

<template>
  <div v-if="section" class="flex min-h-[60vh] animate-rise items-center justify-center">
    <div class="flex w-full max-w-[520px] flex-col gap-5 rounded-xl bg-surface p-8 ring-1 ring-line">
      <span class="w-fit rounded-full bg-marigold-soft px-3 py-1 text-xs font-bold tracking-[.08em] uppercase">Coming next</span>
      <div class="flex flex-col gap-2">
        <h2 class="m-0 mega text-[clamp(28px,3vw,36px)] leading-none">{{ section.title }}</h2>
        <p class="m-0 text-[15px] leading-6 text-ink-muted">{{ section.text }}</p>
      </div>
      <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
        <li v-for="item in section.plan" :key="item" class="flex items-center gap-3 text-[15px]">
          <span class="size-2 shrink-0 rounded-[2px] bg-marigold" aria-hidden="true" />{{ item }}
        </li>
      </ul>
      <Button as-child variant="outline" class="w-fit">
        <NuxtLink to="/dashboard">Back to overview</NuxtLink>
      </Button>
    </div>
  </div>
</template>
