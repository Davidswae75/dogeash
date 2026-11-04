<script setup lang="ts">
import { Star } from '@lucide/vue'
import type { AdminOverview } from '~/utils/admin'
import { initialsOf } from '~/utils/account'

// The verified stores with the most live dogs: rating, reviews and visit requests in the last 30 days
const props = defineProps<{ stores: AdminOverview['topStores'] }>()
</script>

<template>
  <AdminCard title="Top stores" description="Verified stores by live dogs" flush>
    <div class="overflow-x-auto">
      <table v-if="props.stores.length" class="w-full min-w-[520px] border-collapse text-left text-[13px]">
        <thead>
          <tr class="text-[11.5px] text-ink-muted">
            <th scope="col" class="border-t border-line px-5 py-2 font-medium">Store</th>
            <th scope="col" class="border-t border-line px-3 py-2 text-right font-medium">Live dogs</th>
            <th scope="col" class="border-t border-line px-3 py-2 text-right font-medium">Visits, 30 days</th>
            <th scope="col" class="border-t border-line px-5 py-2 text-right font-medium">Rating</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in props.stores" :key="s.public_id" class="hover:bg-surface-sunk/60">
            <td class="border-t border-line px-5 py-2.5">
              <NuxtLink :to="`/stores/${s.public_id.toLowerCase()}`" class="flex items-center gap-3 text-ink no-underline" target="_blank">
                <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-night text-[11px] font-bold text-on-night">{{ initialsOf(s.name) }}</span>
                <span class="flex min-w-0 flex-col leading-tight">
                  <span class="truncate font-medium">{{ s.name }}</span>
                  <span class="font-mono text-[11px] text-ink-muted">{{ s.public_id }} · {{ s.city }}</span>
                </span>
              </NuxtLink>
            </td>
            <td class="border-t border-line px-3 py-2.5 text-right font-mono tabular-nums">{{ s.live_dogs }}</td>
            <td class="border-t border-line px-3 py-2.5 text-right font-mono tabular-nums">{{ s.visits_30 }}</td>
            <td class="border-t border-line px-5 py-2.5 text-right whitespace-nowrap">
              <span class="inline-flex items-center gap-1 font-mono tabular-nums"><Star class="size-3.5 fill-marigold text-marigold" aria-hidden="true" />{{ Number(s.rating).toFixed(1) }}</span>
              <span class="ml-1.5 text-[11.5px] text-ink-muted">({{ s.reviews_count }})</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">No verified stores yet.</p>
    </div>
  </AdminCard>
</template>
