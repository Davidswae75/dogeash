<script setup lang="ts">
import { Dog, Search, Stethoscope, Store, User } from '@lucide/vue'
import type { Component } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { navigateTo, useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase

// Search across the admin console (admin_search()): stores, dogs, people and care providers, grouped, as you
// type. ⌘K / Ctrl+K opens it from any admin page; ↑ ↓ move, Enter opens, Esc closes.
type Hit = { id: string, title: string, detail: string, store_id?: string }
type Group = { key: 'stores' | 'dogs' | 'people' | 'care', label: string, icon: Component, to: (h: Hit) => string }
const groups: Group[] = [
  { key: 'stores', label: 'Stores', icon: Store, to: h => `/admin/stores/${h.id}` },
  { key: 'dogs', label: 'Dogs', icon: Dog, to: h => `/admin/stores/${h.store_id}` },
  { key: 'people', label: 'People', icon: User, to: h => `/admin/people/${h.id}` },
  { key: 'care', label: 'Care providers', icon: Stethoscope, to: () => '/admin/care' },
]

const supabase = useSupabaseClient()
const open = useState('admin-search-open', () => false)
const query = ref('')
const results = ref<Record<Group['key'], Hit[]>>({ stores: [], dogs: [], people: [], care: [] })
const searching = ref(false)
const active = ref(0)

let timer: ReturnType<typeof setTimeout> | undefined
watch(query, (q) => {
  clearTimeout(timer)
  active.value = 0
  if (q.trim().length < 2) return (results.value = { stores: [], dogs: [], people: [], care: [] })
  searching.value = true
  timer = setTimeout(async () => {
    const { data } = await supabase.rpc('admin_search', { q: q.trim() })
    results.value = (data as unknown as typeof results.value) ?? { stores: [], dogs: [], people: [], care: [] }
    searching.value = false
  }, 250)
})
watch(open, (o) => { if (o) { query.value = ''; active.value = 0 } })

// Every hit in order, for the keyboard
const flat = computed(() => groups.flatMap(g => results.value[g.key].map(h => ({ group: g, hit: h }))))
function go(i: number) {
  const item = flat.value[i]
  if (!item) return
  open.value = false
  navigateTo(item.group.to(item.hit))
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') { e.preventDefault(); active.value = Math.min(flat.value.length - 1, active.value + 1) }
  if (e.key === 'ArrowUp') { e.preventDefault(); active.value = Math.max(0, active.value - 1) }
  if (e.key === 'Enter') { e.preventDefault(); go(active.value) }
}
const indexOf = (hit: Hit) => flat.value.findIndex(f => f.hit === hit)

// ⌘K / Ctrl+K from anywhere in the console
function onGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open.value = !open.value }
}
onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-[600px] [&>button:last-child]:hidden">
      <DialogTitle class="sr-only">Search the admin console</DialogTitle>
      <label class="flex items-center gap-3 border-b border-line px-4">
        <Search class="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        <input v-model="query" type="search" autofocus placeholder="Stores, dogs, file numbers, people, emails, phones…" class="h-14 w-full border-0 bg-transparent text-[15px] outline-none" aria-label="Search" @keydown="onKey">
        <kbd class="rounded border border-line px-1.5 font-mono text-[10.5px] text-ink-muted">Esc</kbd>
      </label>
      <div class="max-h-[min(460px,60vh)] overflow-y-auto p-2">
        <p v-if="query.trim().length < 2" class="m-0 px-3 py-6 text-center text-[13px] text-ink-muted">Type at least two letters. ↑ ↓ to move, Enter to open.</p>
        <p v-else-if="!searching && !flat.length" class="m-0 px-3 py-6 text-center text-[13px] text-ink-muted">Nothing matches "{{ query }}".</p>
        <template v-for="g in groups" :key="g.key">
          <div v-if="results[g.key].length" class="flex flex-col pb-1">
            <span class="px-3 pt-2 pb-1 font-mono text-[10px] tracking-[.14em] text-ink-muted uppercase">{{ g.label }}</span>
            <button
              v-for="h in results[g.key]"
              :key="h.id"
              type="button"
              :class="['flex w-full cursor-pointer items-center gap-3 rounded-lg border-0 px-3 py-2 text-left', indexOf(h) === active ? 'bg-surface-sunk' : 'bg-transparent hover:bg-surface-sunk/60']"
              @mouseenter="active = indexOf(h)"
              @click="go(indexOf(h))"
            >
              <component :is="g.icon" class="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span class="flex min-w-0 flex-col leading-tight">
                <span class="truncate text-[13.5px] font-semibold text-ink">{{ h.title }}</span>
                <span class="truncate font-mono text-[11px] text-ink-muted">{{ h.detail }}</span>
              </span>
            </button>
          </div>
        </template>
      </div>
    </DialogContent>
  </Dialog>
</template>
