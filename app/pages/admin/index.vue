<script setup lang="ts">
import { RefreshCw } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { Metric } from '~/utils/admin'
import { useAdmin } from '~/composables/useAdmin'
import { useSession } from '~/composables/useSession'
import { chartMetrics, count, metrics, periodTotals } from '~/utils/admin'

// Admin overview. The period (7 or 30 days) sets the headline numbers, their change against the period
// before, and the activity chart; clicking a headline number charts that measure. Below: what's waiting,
// every store with its status (and the actions to change it), supply by status, the top stores,
// where the dogs are, admin activity and the newest reviews.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Overview · Dogeash admin', robots: 'noindex' })

const { firstName } = useSession()
const { overview, audit, error, history, loadOverview, loadHistory, loadStores } = useAdmin()
const loading = ref(false)
const loadedAt = ref<Date>()
async function refresh() {
  loading.value = true
  await Promise.all([loadOverview(), loadStores()])
  loading.value = false
  loadedAt.value = new Date()
}
onMounted(refresh)

const periods = [{ days: 7, label: '7 days' }, { days: 30, label: '30 days' }, { days: 90, label: '90 days' }, { days: 365, label: '1 year' }]
const days = ref(30)
const daysModel = computed({
  get: () => String(days.value),
  set: (v: string) => {
    if (!v) return
    days.value = Number(v)
    if (days.value > 30) loadHistory(days.value)
  },
})
// The overview carries 60 days; longer periods use the fuller history once it has loaded
const series = computed(() => (days.value > 30 && history.value && history.value.days >= days.value * 2 ? history.value.series : overview.value?.series ?? []))
const periodLabel = computed(() => (days.value === 365 ? 'year' : `${days.value} days`))
const metric = ref<Metric>('accounts')

const kpis = computed(() => {
  return metrics.map(m => ({ ...m, ...periodTotals(series.value, m.key, days.value), trend: series.value.slice(-days.value).map(d => d[m.key]) }))
})
const chosen = computed(() => chartMetrics.find(m => m.key === metric.value)!)
const points = computed(() => series.value.slice(-days.value).map(d => ({ day: d.day, value: d[metric.value] })))
const hour = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
const today = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1">
        <span class="font-mono text-[11px] tracking-[.14em] text-ink-muted uppercase">{{ today }}</span>
        <h1 class="m-0 text-[26px] leading-8 font-semibold tracking-tight">{{ greeting }}, {{ firstName }}</h1>
        <p class="m-0 text-sm text-ink-muted">Here's how the marketplace is doing.</p>
      </div>
      <div class="flex max-w-full flex-wrap items-center gap-3">
        <span v-if="loadedAt" class="hidden text-xs text-ink-muted sm:inline">Updated {{ loadedAt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: false }) }}</span>
        <ToggleGroup v-model="daysModel" type="single" variant="outline" size="sm" aria-label="Period" class="max-w-full flex-wrap justify-start rounded-lg bg-surface">
          <ToggleGroupItem v-for="p in periods" :key="p.days" :value="String(p.days)" class="px-3 text-xs">{{ p.label }}</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="outline" size="sm" :disabled="loading" aria-label="Refresh" @click="refresh">
          <RefreshCw :class="['size-4', loading && 'animate-spin']" aria-hidden="true" />
        </Button>
      </div>
    </header>

    <p v-if="error" class="m-0 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger ring-1 ring-danger/30" role="alert">{{ error }}</p>

    <!-- Loading: the shapes of what's coming -->
    <div v-if="!overview && !error" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
      <Skeleton v-for="i in 4" :key="i" class="h-[150px] rounded-2xl" />
      <Skeleton class="h-[330px] rounded-2xl sm:col-span-2 xl:col-span-3" />
      <Skeleton class="h-[330px] rounded-2xl" />
    </div>

    <template v-if="overview">
      <div class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <AdminKpiCard
          v-for="k in kpis"
          :key="k.key"
          :label="k.label"
          :value="k.now"
          :change="k.change"
          :period="periodLabel"
          :trend="k.trend"
          :active="metric === k.key"
          @select="metric = k.key"
        />
      </div>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AdminCard :title="chosen.label" :description="`Per day, last ${periodLabel} · ${count(points.reduce((s, p) => s + p.value, 0))} in all`">
          <template #actions>
            <SelectMenu v-model="metric" :options="chartMetrics.map(m => ({ value: m.key, label: m.label }))" aria-label="Measure to chart" class="w-fit text-xs" />
          </template>
          <AdminChartAreaChart :points="points" :label="chosen.label" :unit="chosen.unit" />
        </AdminCard>
        <AdminWaiting :o="overview" />
      </div>

      <AdminStores />

      <div class="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <AdminPipeline :o="overview" />
        <AdminTopStores :stores="overview.topStores" />
      </div>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
        <AdminCard title="Where the dogs are" description="Live listings by city">
          <AdminChartBarList v-if="overview.cities.length" :rows="overview.cities.map(c => ({ label: c.city, value: c.dogs }))" unit="live dogs" />
          <p v-else class="m-0 text-[13px] text-ink-muted">No live dogs yet.</p>
        </AdminCard>
        <AdminAuditFeed :entries="audit" />
        <AdminNewestReviews :reviews="overview.newest.reviews" />
      </div>

      <p class="m-0 text-center font-mono text-[11px] text-ink-muted">
        {{ count(overview.accounts) }} accounts · {{ count(overview.careProviders) }} care providers · {{ count(overview.staff) }} staff · days run on Lagos time
      </p>
    </template>
  </div>
</template>
