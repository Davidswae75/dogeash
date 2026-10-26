<script setup lang="ts">
import { ImagePlus, MessageSquare, Plus, Syringe, Wallet } from '@lucide/vue'
import type { Component } from 'vue'

// Store dashboard overview: what needs doing, what's coming up, and how the dogs are doing
definePageMeta({ layout: 'dashboard', title: 'Overview' })
useSeoMeta({ title: 'Overview · Store dashboard · Dogeash', robots: 'noindex' })

const store = sampleStores[0]!
const summary = storeSummary(store)
const firstName = store.owner.name.split(' ').filter(w => /^[A-Z][a-z]/.test(w) && !w.endsWith('.'))[0]

const attentionIcons: Record<string, Component> = { MessageSquare, Wallet, Syringe, ImagePlus }
const toneClass: Record<string, string> = {
  marigold: 'bg-marigold text-on-marigold',
  night: 'bg-night text-marigold',
  ash: 'bg-ash-soft text-ink',
}

const profileDone = profileChecklist.filter(i => i.done).length
const profilePct = Math.round((profileDone / profileChecklist.length) * 100)

// Sparkline points for a 7-day trend, scaled to a 100×32 box
function sparkline(values: number[]) {
  const max = Math.max(...values, 1)
  return values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - (v / max) * 26}`).join(' ')
}

const eyebrow = 'text-xs leading-4 font-bold tracking-[.08em] uppercase'
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Greeting -->
    <section class="flex animate-rise flex-wrap items-end justify-between gap-5">
      <div class="flex flex-col gap-2">
        <span :class="[eyebrow, 'text-ink-muted']">{{ store.name }} · Last 7 days</span>
        <h2 class="m-0 mega text-[clamp(30px,3.4vw,44px)] leading-none">Welcome back, <span class="text-outline">{{ firstName }}</span></h2>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button as-child variant="outline" size="sm"><NuxtLink to="/dashboard/enquiries">Reply to enquiries</NuxtLink></Button>
        <Button as-child size="sm"><NuxtLink to="/dashboard/dogs"><Plus aria-hidden="true" />Add a dog</NuxtLink></Button>
      </div>
    </section>

    <!-- Numbers -->
    <section aria-label="This week" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 rise-stagger">
      <div v-for="stat in dashboardStats" :key="stat.label" class="flex animate-rise flex-col gap-3 rounded-xl bg-surface p-5 ring-1 ring-line">
        <span class="text-sm font-semibold text-ink-muted">{{ stat.label }}</span>
        <div class="flex items-end justify-between gap-3">
          <span class="mega text-[40px] leading-none tabular-nums">{{ stat.value }}</span>
          <svg viewBox="0 0 100 32" class="h-8 w-24" aria-hidden="true">
            <polyline :points="sparkline(stat.trend)" fill="none" class="stroke-marigold" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span class="text-[13px] font-semibold text-ink-muted"><span class="text-ink">{{ stat.change }}</span> vs last week</span>
      </div>
    </section>
    <p class="-mt-5 mb-0 font-mono text-xs text-ink-muted">Example figures for the design.</p>

    <div class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <!-- Needs attention -->
      <section class="flex flex-col gap-4 rounded-xl bg-surface p-6 ring-1 ring-line">
        <div class="flex items-center justify-between">
          <h3 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Needs your attention</h3>
          <span class="grid h-6 min-w-6 place-items-center rounded-full bg-marigold px-2 text-xs font-bold text-on-marigold">{{ dashboardAttention.length }}</span>
        </div>
        <ul class="m-0 flex list-none flex-col divide-y divide-line p-0">
          <li v-for="item in dashboardAttention" :key="item.title" class="flex items-center gap-4 py-4 first:pt-1 last:pb-0">
            <span :class="['grid size-10 shrink-0 place-items-center rounded-md', toneClass[item.tone]]">
              <component :is="attentionIcons[item.icon]" class="size-[18px]" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1">
              <strong class="block text-[15px] leading-[22px]">{{ item.title }}</strong>
              <span class="text-[13px] leading-5 text-ink-muted">{{ item.text }}</span>
            </span>
            <Button as-child variant="outline" size="sm" class="shrink-0">
              <NuxtLink :to="item.to">{{ item.action }}</NuxtLink>
            </Button>
          </li>
        </ul>
      </section>

      <!-- Upcoming -->
      <section class="flex flex-col gap-4 rounded-xl bg-night p-6 text-on-night">
        <div class="flex items-center justify-between">
          <h3 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Coming up</h3>
          <NuxtLink to="/dashboard/bookings" class="text-sm font-semibold text-marigold no-underline hover:underline">All bookings</NuxtLink>
        </div>
        <ol class="m-0 flex list-none flex-col gap-3 p-0">
          <li v-for="event in dashboardUpcoming" :key="event.title + event.date" class="flex gap-4 rounded-lg bg-on-night/5 p-3.5 ring-1 ring-on-night/10">
            <span class="flex w-12 shrink-0 flex-col items-center justify-center rounded-md bg-marigold py-1.5 text-on-marigold">
              <span class="text-[10px] font-bold tracking-[.08em] uppercase">{{ event.day }}</span>
              <span class="mega text-[22px] leading-none">{{ event.date }}</span>
            </span>
            <span class="min-w-0">
              <strong class="block text-[15px] leading-[22px]">{{ event.title }} <span class="font-mono text-xs font-medium text-marigold">· {{ event.time }}</span></strong>
              <span class="block text-[13px] leading-5">{{ event.who }}</span>
              <span class="block text-[13px] leading-5 opacity-70">{{ event.where }}</span>
            </span>
          </li>
        </ol>
      </section>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <!-- Dogs -->
      <section class="flex min-w-0 flex-col gap-4 rounded-xl bg-surface p-6 ring-1 ring-line">
        <div class="flex items-center justify-between">
          <h3 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Your dogs</h3>
          <NuxtLink to="/dashboard/dogs" class="text-sm font-semibold text-ink no-underline hover:underline">Manage dogs</NuxtLink>
        </div>
        <div class="-mx-6 overflow-x-auto px-6">
          <table class="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr class="text-[11px] font-bold tracking-[.08em] text-ink-muted uppercase">
                <th scope="col" class="pb-3 font-bold">Dog</th>
                <th scope="col" class="pb-3 font-bold">Level</th>
                <th scope="col" class="pb-3 font-bold">Status</th>
                <th scope="col" class="pb-3 text-right font-bold">Price</th>
                <th scope="col" class="pb-3 text-right font-bold">Views</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dog in summary.dogs" :key="dog.fileNo" class="border-t border-line">
                <td class="py-3">
                  <NuxtLink :to="`/dogs/${dog.fileNo.toLowerCase()}`" class="flex items-center gap-3 text-ink no-underline hover:underline">
                    <img v-if="dog.photo" :src="dog.photo" alt="" class="size-10 rounded-md object-cover">
                    <span>
                      <strong class="block">{{ dog.name }}</strong>
                      <span class="font-mono text-xs text-ink-muted">{{ dog.fileNo }}</span>
                    </span>
                  </NuxtLink>
                </td>
                <td class="py-3">
                  <span class="flex items-center gap-2">
                    <span class="flex gap-0.5" aria-hidden="true">
                      <i v-for="n in 5" :key="n" :class="['h-1.5 w-2.5 rounded-[1px]', n <= dog.level ? (n >= 4 ? 'bg-marigold' : 'bg-action') : 'bg-line']" />
                    </span>
                    <span class="font-semibold">{{ dog.level }}</span>
                  </span>
                </td>
                <td class="py-3">
                  <span :class="['inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', dog.status === 'available' ? 'bg-marigold-soft text-ink' : 'bg-ash-soft text-ink-muted']">
                    <span :class="['size-1.5 rounded-full', dog.status === 'available' ? 'bg-marigold' : 'bg-ash']" aria-hidden="true" />
                    {{ dog.status === 'available' ? 'Available' : 'Reserved' }}
                  </span>
                </td>
                <td class="py-3 text-right font-mono font-semibold tabular-nums">{{ formatNaira(dog.priceNaira) }}</td>
                <td class="py-3 text-right font-mono tabular-nums text-ink-muted">{{ dashboardDogStats[dog.fileNo]?.views ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Store profile -->
      <section class="flex flex-col gap-5 rounded-xl bg-surface p-6 ring-1 ring-line">
        <div class="flex items-center justify-between">
          <h3 class="m-0 font-display text-lg font-extrabold font-stretch-expanded">Store profile</h3>
          <span class="font-mono text-sm font-semibold">{{ profilePct }}%</span>
        </div>
        <div class="h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" :aria-valuenow="profilePct" aria-valuemin="0" aria-valuemax="100" aria-label="Store profile complete">
          <div class="h-full rounded-full bg-marigold transition-[width] duration-700 ease-calm" :style="{ width: `${profilePct}%` }" />
        </div>
        <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
          <li v-for="item in profileChecklist" :key="item.label" class="flex items-center gap-3 text-sm">
            <span :class="['grid size-5 shrink-0 place-items-center rounded-full', item.done ? 'bg-ink text-canvas' : 'border-2 border-dashed border-line-strong']">
              <AppIcon v-if="item.done" name="check" :size="12" />
            </span>
            <span :class="item.done ? 'text-ink-muted line-through decoration-line-strong' : 'font-semibold'">{{ item.label }}</span>
          </li>
        </ul>
        <StoreBanner :store="store" class="mt-auto aspect-[16/6] rounded-lg" />
        <p class="-mt-2 mb-0 text-[13px] text-ink-muted">Your banner today. Upload your own in Store profile.</p>
      </section>
    </div>
  </div>
</template>
