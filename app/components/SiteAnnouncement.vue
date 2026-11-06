<script setup lang="ts">
import { Megaphone, X } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useSupabaseClient } from '#imports'

// A strip across the top of the site when Dogeash has an announcement running for everyone (site_banner()):
// downtime, policy changes. Each visitor can close it; it stays closed for that announcement.
const supabase = useSupabaseClient()
const banner = ref<{ id: string, title: string, body: string, link: string | null } | null>(null)
const KEY = 'dogeash-closed-announcement'

onMounted(async () => {
  const { data } = await supabase.rpc('site_banner')
  const b = data as unknown as typeof banner.value
  let closed = ''
  try { closed = localStorage.getItem(KEY) ?? '' }
  catch {}
  banner.value = b && b.id !== closed ? b : null
})
function close() {
  try { if (banner.value) localStorage.setItem(KEY, banner.value.id) }
  catch {}
  banner.value = null
}
</script>

<template>
  <div v-if="banner" class="bg-night px-4 py-2.5 text-sm text-on-night sm:px-8" role="status">
    <span class="mx-auto flex max-w-page items-start gap-2.5">
      <Megaphone class="mt-0.5 size-4 shrink-0 text-marigold" aria-hidden="true" />
      <span class="flex-1"><strong class="font-semibold">{{ banner.title }}</strong> {{ banner.body }}
        <NuxtLink v-if="banner.link" :to="banner.link" class="ml-1 font-semibold text-marigold underline underline-offset-4">More</NuxtLink>
      </span>
      <button type="button" class="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-on-night/70 hover:text-on-night" aria-label="Close announcement" @click="close"><X class="size-4" aria-hidden="true" /></button>
    </span>
  </div>
</template>
